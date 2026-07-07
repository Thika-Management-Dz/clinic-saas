// packages/db/src/tenant.ts
//
// Request-scoped tenant context helpers.
// Per Roadmap v2.1 §5.3 — TenantInterceptor stores the tenant transaction
// on the request object. Downstream services use these helpers to access it.
//
// CRITICAL: every query on a tenant-scoped table MUST go through the
// tenant transaction. Querying the global `db` instance without a tenant
// context returns 0 rows (RLS blocks everything) — this is the correct
// security posture per ADR-001.

import type postgres from 'postgres';

/**
 * Extend FastifyRequest with tenant context fields.
 * Stored by the TenantInterceptor (apps/api/infrastructure/rls/).
 */
export interface TenantRequest {
  /** The postgres.js transaction with SET LOCAL app.current_tenant applied. */
  __tenantTx?: postgres.TransactionSql;
  /** The resolved tenant (organization) ID string. */
  __tenantId?: string;
  /** The authenticated Better Auth user ID. */
  __userId?: string;
}

/**
 * Get the tenant-scoped transaction from the request.
 * Throws if no transaction is set — this means the TenantInterceptor
 * is not active or the request is exempt from tenant context.
 */
export function getTenantTx(req: { __tenantTx?: postgres.TransactionSql }): postgres.TransactionSql {
  const tx = req.__tenantTx;
  if (!tx) {
    throw new Error(
      'No tenant transaction on request. ' +
        'The TenantInterceptor must be active for tenant-scoped queries. ' +
        'If this is a non-tenant-scoped operation, ensure the endpoint is ' +
        'in TENANT_EXEMPT_PATHS.',
    );
  }
  return tx;
}

/**
 * Get the tenant ID from the request. Returns undefined if no tenant
 * context is set (e.g., super_admin without an active organization).
 */
export function getTenantId(req: { __tenantId?: string }): string | undefined {
  return req.__tenantId;
}