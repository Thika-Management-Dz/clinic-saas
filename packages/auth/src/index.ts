// packages/auth/src/index.ts
//
// Public API for the @clinic-saas/auth package.
// Wraps Better Auth (per ADR-004) with the Organization plugin for
// multi-tenant scoping.

export { auth } from './auth.js';