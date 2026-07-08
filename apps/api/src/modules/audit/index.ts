// apps/api/src/modules/audit/index.ts
//
// Public API for the audit module.
// Per ADR-002: cross-module imports go through index.ts only.

export { AuditModule } from './audit.module.js';
export { AuditInterceptor } from './audit.interceptor.js';