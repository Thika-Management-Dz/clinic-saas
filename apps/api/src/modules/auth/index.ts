// apps/api/src/modules/auth/index.ts
//
// Public API for the auth module.
// Per ADR-002: cross-module imports go through index.ts only.

export { AuthModule } from './auth.module.js';
export { AuthController } from './auth.controller.js';
export { PermissionsGuard } from './permissions.guard.js';
export { RequirePermissions, REQUIRE_PERMISSIONS_KEY } from './permissions.decorator.js';