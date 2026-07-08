// packages/auth/src/auth.ts
//
// Better Auth configuration. Per Roadmap v2.1 §5.1.1 and ADR-004.
//
// Self-hosted authentication with the Organization plugin for multi-tenant
// SaaS. The organization maps to a clinic (tenant). The member table
// tracks user↔tenant membership (P0-6 resolution, 90-4).
//
// IMPORTANT: This module imports `db` from @clinic-saas/db (the public API).
// It does NOT import internal files — enforced by AGENTS.md Blueprint §7.4.
//
// RBAC PLUGIN DECISION (HIGH-9):
// ADR-004 states "Better Auth with the Organization and RBAC plugins."
// Better Auth v1.6 does NOT have a separate RBAC plugin. The available
// plugins are listed in node_modules/better-auth/dist/plugins/ — none
// are named "rbac". RBAC is enforced by the custom PermissionsGuard
// (apps/api/src/modules/auth/permissions.guard.ts) which walks the
// role_inheritance graph (Blueprint §9.2, NIST RBAC recursive CTE).
// The Organization plugin's member.role field stores a simple role
// label, but the actual privilege computation uses our own role/
// privilege/role_inheritance tables — not Better Auth's built-in roles.

import { db, authUser, authSession, authAccount, authVerification, authOrganization, authMember, authInvitation } from '@clinic-saas/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';

export const auth = betterAuth({
  trustHost: true,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: authUser,
      session: authSession,
      account: authAccount,
      verification: authVerification,
      organization: authOrganization,
      member: authMember,
      invitation: authInvitation,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: false,
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // 1 day
  },
});