// apps/api/src/infrastructure/rls/tenant.interceptor.ts
//
// TenantInterceptor — the RLS perimeter. Per Roadmap v2.1 §5.3 and ADR-001.
//
// For every request (except health/auth), this interceptor:
//   1. Resolves the tenant (organization) ID from the Better Auth session.
//   2. Opens a postgres.js transaction.
//   3. Issues SELECT set_tenant($1) — PARAMETERIZED, never interpolated.
//   4. Stores the transaction on the request for downstream services.
//   5. Commits or rolls back after the handler completes.
//
// CRITICAL (P0-3 fix from critical review §3.3):
//   The set_tenant(uuid) function is SECURITY DEFINER (004_set_tenant.sql).
//   It MUST be called via a parameterized query: `SELECT set_tenant($1)`.
//   NEVER use string interpolation or unsafe() for the tenant context.
//
// CRITICAL (ADR-001):
//   Without SET LOCAL app.current_tenant, RLS policies return 0 rows
//   for ALL tenant-scoped tables. This is the correct default — the app
//   MUST set the tenant before querying tenant data.

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { from, firstValueFrom, Observable, switchMap } from 'rxjs';

import type { TenantRequest } from '@clinic-saas/db';
import { sql } from '@clinic-saas/db';
import { auth } from '@clinic-saas/auth';
import type { FastifyRequest } from 'fastify';

/** Paths that don't require tenant context. */
const TENANT_EXEMPT_PATHS = ['/api/health', '/api/auth/', '/'];

/**
 * Optional decorator to mark a controller/handler as tenant-exempt.
 * Applied automatically for paths in TENANT_EXEMPT_PATHS, but can be
 * used for custom endpoints that don't need tenant isolation.
 */
export const TENANT_EXEMPT_KEY = 'tenant:exempt';
export const TenantExempt = () => SetMetadata(TENANT_EXEMPT_KEY, true);

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & TenantRequest>();
    const rawUrl = request.url ?? '/';
    const path = rawUrl.split('?')[0] ?? '';

    // Check explicit exemption via decorator.
    const isExempt = this.reflector.getAllAndOverride<boolean>(TENANT_EXEMPT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isExempt || TENANT_EXEMPT_PATHS.some((p) => path === p || path.startsWith(p))) {
      return next.handle();
    }

    // Resolve tenant ID from Better Auth session, then wrap in transaction.
    return from(this.resolveTenantContext(request)).pipe(
      switchMap((tenantId) => {
        if (!tenantId) {
          // No active organization. The user is either:
          //   a) Unauthenticated — auth guard will handle this (401).
          //   b) super_admin without an active org — must call switch-tenant.
          // In both cases, proceed without tenant context. RLS will block
          // any tenant-scoped queries (0 rows returned), which is correct.
          return next.handle();
        }

        request.__tenantId = tenantId;
        this.logger.debug(`Tenant context set: ${tenantId}`);

        // Wrap the handler in a postgres.js transaction with SET LOCAL.
        return new Observable<unknown>((subscriber) => {
          void (async () => {
            try {
              await sql.begin(async (t) => {
                // Store the transaction on the request for downstream services.
                request.__tenantTx = t;

                // CRITICAL: Parameterized query — NEVER string interpolation.
                // The set_tenant() function is SECURITY DEFINER.
                // Per 004_set_tenant.sql and P0-3 fix.
                await t`SELECT set_tenant(${tenantId})`;
              });
            } catch (err) {
              subscriber.error(err);
              return;
            }

            // Run the NestJS handler. Downstream services use request.__tenantTx.
            try {
              await firstValueFrom(next.handle());
              subscriber.next(undefined);
              subscriber.complete();
            } catch (err) {
              subscriber.error(err);
            }
          })();
        });
      }),
    );
  }

  /**
   * Resolve the tenant (organization) ID from the Better Auth session.
   * Returns null if:
   *   - No session (unauthenticated)
   *   - Session has no activeOrganizationId (super_admin without active org)
   *   - Session is invalid
   */
  private async resolveTenantContext(
    request: FastifyRequest,
  ): Promise<string | null> {
    try {
      // Build headers object for Better Auth's getSession API.
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(request.headers)) {
        if (typeof value === 'string') {
          headers[key] = value;
        } else if (Array.isArray(value)) {
          headers[key] = value.join(', ');
        }
      }

      const session = await auth.api.getSession({ headers });
      if (!session) return null;

      // Store the user ID on the request for downstream use.
      const tenantReq = request as FastifyRequest & TenantRequest;
      tenantReq.__userId = session.user.id;

      // The activeOrganizationId is set by the organization plugin's
      // setActiveOrganization endpoint.
      return session.session?.activeOrganizationId ?? null;
    } catch {
      // Session invalid or missing — no tenant context.
      return null;
    }
  }
}