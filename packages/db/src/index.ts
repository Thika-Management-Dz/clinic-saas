// packages/db/src/index.ts
//
// Public API for the @clinic-saas/db package.
// Cross-package imports MUST go through this file (enforced by eslint
// no-restricted-imports per Blueprint §7.4).

export { db, sql } from './db.js';
export * from './schema/index.js';
export * from './tenant.js';