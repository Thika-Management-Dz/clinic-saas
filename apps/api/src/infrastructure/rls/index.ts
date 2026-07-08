// apps/api/src/infrastructure/rls/index.ts
//
// Public API for the RLS infrastructure module.
// Per ADR-002: cross-module imports go through index.ts only.

export { RlsModule } from './rls.module.js';
export { TenantInterceptor } from './tenant.interceptor.js';
export { TenantExempt, TENANT_EXEMPT_KEY } from './tenant.interceptor.js';