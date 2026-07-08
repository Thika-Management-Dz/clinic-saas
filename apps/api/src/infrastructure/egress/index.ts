// apps/api/src/infrastructure/egress/index.ts
//
// Public API for the egress infrastructure module.
// Per ADR-002: cross-module imports go through index.ts only.

export { EgressModule } from './egress.module.js';
export { EgressGuard, createEgressFetch } from './egress.guard.js';