// apps/api/src/modules/auth/permissions.guard.ts
//
// PermissionsGuard — RBAC enforcement. Per Roadmap v2.1 §5.4 and
// Blueprint §9.2 (NIST RBAC + OpenMRS inheritance).
//
// Reads @RequirePermissions() from the handler, walks the user's
// role_inheritance graph to compute effective privileges, and
// checks if all required privileges are in the effective set.
//
// Phase 5: The guard is registered but full RBAC walk is deferred to
// Phase 10 when domain module endpoints exist. Currently returns true
// for authenticated users (the guard structure is in place; the actual
// privilege check will be activated when domain controllers use
// @RequirePermissions).

import type { TenantRequest } from '@clinic-saas/db';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';

import { REQUIRE_PERMISSIONS_KEY } from './permissions.decorator.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permissions required — allow access.
    if (!required || required.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & TenantRequest>();
    const userId = request.__userId;

    // Unauthenticated — the auth guard should have returned 401.
    // Defense-in-depth: deny here too.
    if (!userId) return false;

    // TODO (Phase 10): Walk role_inheritance graph to compute effective
    // privilege set for this user in the current tenant.
    //
    // Algorithm:
    //   1. Get user's role(s) from user_role WHERE user_id = $1 AND
    //      tenant_id = $2 (using the tenant context).
    //   2. For each role, walk role_inheritance (BFS/DFS) to collect
    //      all ancestor roles.
    //   3. For each role (own + ancestors), look up role_privilege to
    //      get all privilege keys.
    //   4. Check if every required permission is in the set.
    //
    // REVIEW: Activate the full RBAC check in Phase 10.

    return true;
  }
}