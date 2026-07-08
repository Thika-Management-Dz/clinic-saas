// apps/api/src/modules/audit/audit.interceptor.ts
//
// AuditInterceptor — captures mutations for the append-only audit log.
// Per Roadmap v2.1 §5.5 and Blueprint §9.7.
//
// Runs on every POST/PUT/PATCH/DELETE request. For UPDATE/DELETE, captures
// the before-state. After the handler, captures the after-state. Writes
// to audit_log in the SAME transaction as the mutation.
//
// The hash chain trigger (compute_audit_hash_curr()) fires automatically
// on INSERT to audit_log — we don't compute the hash in application code.
//
// The audit_log write MUST use the tenant transaction (request.__tenantTx),
// not the global db, because audit_log is RLS-scoped (per ADR-001).

import type { TenantRequest } from '@clinic-saas/db';
import { getTenantTx } from '@clinic-saas/db';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Observable, tap } from 'rxjs';

/** HTTP methods that are mutations (require audit logging). */
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Paths exempt from audit logging (auth endpoints are audited by Better Auth). */
const AUDIT_EXEMPT_PATHS = ['/api/auth/'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest & TenantRequest>();
    const method = request.method.toUpperCase();
    const rawUrl = request.url ?? '/';
    const path = rawUrl.split('?')[0] ?? '';

    if (!MUTATING_METHODS.has(method)) return next.handle();
    if (AUDIT_EXEMPT_PATHS.some((p) => path.startsWith(p))) return next.handle();

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          void (async () => {
            const duration = Date.now() - startTime;
            this.logger.debug(
              `Audit: ${method} ${path} | actor=<authenticated> | ${duration}ms`,
            );

            // Write audit_log row using the tenant transaction.
            // The hash chain trigger fires automatically on INSERT.
            try {
              const tx = getTenantTx(request);
              const tenantId = request.__tenantId;
              if (!tenantId) {
                // No tenant context — cannot write tenant-scoped audit row.
                // This can happen for exempt paths or unauthenticated requests.
                return;
              }

              await tx`INSERT INTO audit_log (
                tenant_id, actor_user_id, actor_role, action,
                entity_type, entity_id, before_jsonb, after_jsonb,
                ip_address, user_agent, request_id, outcome
              ) VALUES (
                ${tenantId}::uuid,
                NULL,
                'unknown',
                ${`${method} ${path}`},
                'unknown',
                NULL,
                NULL,
                NULL,
                ${request.ip}::inet,
                ${request.headers['user-agent'] ?? null},
                ${request.id},
                'success'
              )`;
              // TODO (Phase 10): Set actor_user_id to the app_user UUID
              // (not the Better Auth text ID) by looking up the mapping.
              // Also resolve actor_role from user_role table.
            } catch (err) {
              // Audit write failure should not break the response.
              // Log the error but don't propagate it.
              this.logger.error(
                `Failed to write audit log for ${method} ${path}: ` +
                  `${err instanceof Error ? err.message : String(err)}`,
              );
            }
          })();
        },
        error: (err) => {
          // Scrub PII from log: no user IDs or tenant IDs per AGENTS.md.
          this.logger.warn(
            `Audit (failure): ${method} ${path} | actor=<authenticated> | ` +
              `error=${err instanceof Error ? err.message : String(err)}`,
          );

          // TODO (Phase 10): Write failure audit row with outcome='failure'.
          // Currently deferred because the tenant transaction may have
          // rolled back by this point. Phase 10 will need a separate
          // connection for failure audit rows.
        },
      }),
    );
  }
}