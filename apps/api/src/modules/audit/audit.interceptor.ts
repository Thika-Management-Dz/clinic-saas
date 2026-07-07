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
// Phase 5: The interceptor structure is in place. It will be fully
// active when domain module endpoints exist (Phase 10). For now,
// it captures and logs mutation metadata.

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { FastifyRequest } from 'fastify';

import type { TenantRequest } from '@clinic-saas/db';

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
          const duration = Date.now() - startTime;
          this.logger.debug(
            `Audit: ${method} ${path} | actor=${request.__userId ?? 'anon'} | ` +
              `tenant=${request.__tenantId ?? 'none'} | ${duration}ms`,
          );

          // TODO (Phase 10): Write to audit_log.
          //
          // Fields per Blueprint §9.7:
          //   tenant_id, actor_user_id, actor_role, action,
          //   entity_type, entity_id, before_jsonb, after_jsonb,
          //   ip_address, user_agent, request_id, outcome
          //
          // The audit_log write MUST use the same transaction as the
          // mutation (request.__tenantTx). The hash chain trigger
          // (compute_audit_hash_curr) fires automatically.
          //
          // For UPDATE: capture before-state BEFORE the handler runs
          // (using a pre-interceptor or a second pass).
          // For INSERT: before_jsonb is NULL.
          // For DELETE (soft): before_jsonb has the full row,
          //   after_jsonb has { deleted_at: <timestamp> }.
          //
          // REVIEW: Activate audit_log writes in Phase 10 when domain
          // module controllers exist and entity_type/entity_id can be
          // resolved from the route parameters.
        },
        error: (err) => {
          this.logger.warn(
            `Audit (failure): ${method} ${path} | actor=${request.__userId ?? 'anon'} | ` +
              `error=${err instanceof Error ? err.message : String(err)}`,
          );

          // TODO (Phase 10): Write failure audit row.
          // Outcome = 'failure' per Blueprint §9.7.
        },
      }),
    );
  }
}