// apps/api/src/modules/auth/permissions.decorator.ts
//
// @RequirePermissions decorator for the PermissionsGuard.
// Per Roadmap v2.1 §5.4 and Blueprint §9.2 (NIST RBAC).
//
// Usage:
//   @RequirePermissions('patient:read:any', 'encounter:write')
//   @Get('/patients')
//   async listPatients() { ... }
//
// Privilege format: resource:action[:scope]
//   resource — entity type (patient, encounter, invoice, etc.)
//   action   — operation (read, write, delete, etc.)
//   scope    — data scope (any, my, own) — optional
//
// Blueprint §9.2 defines the canonical privilege strings.

import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSIONS_KEY = 'require:permissions';

/**
 * Marks a handler (or controller) as requiring specific permissions.
 * The PermissionsGuard checks these against the user's effective
 * privilege set (computed via role_inheritance graph walk).
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);