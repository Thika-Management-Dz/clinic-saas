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

import { db, authUser, authSession, authAccount, authVerification, authOrganization, authMember, authInvitation } from '@clinic-saas/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';

export const auth = betterAuth({
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