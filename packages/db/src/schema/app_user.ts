// packages/db/src/schema/app_user.ts
//
// Application users. Per Roadmap v2.1 §4.3.2 and ADR-001.
//
// app_user IS tenant-scoped. tenant_id is nullable for super_admin users
// (cross-tenant). The RLS policy handles NULL tenant_id:
//   tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid
// When current_tenant is set, only users with that tenant_id are visible.
// Users with tenant_id=NULL (super_admin) are only visible when
// current_tenant is NOT set (cross-tenant admin mode). This is the correct
// security posture: tenant-scoped queries don't leak super_admin accounts.
//
// The login flow (Phase 5) needs special handling: it must find a user by
// email WITHOUT a tenant context. This will be handled by the auth module
// (Phase 5) which queries app_user via a path that doesn't go through the
// standard RLS policy (e.g., a SECURITY DEFINER function or a separate
// connection that sets current_tenant to a special system value).

import { sql } from 'drizzle-orm';
import { pgTable, uuid, text, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';

import { tenantPolicy } from '../rls';

import { clinic } from './clinic';
import { role } from './role';

export const appUser = pgTable(
  'app_user',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Nullable for super_admin (cross-tenant). NOT NULL for all other users.
    tenantId: uuid('tenant_id').references(() => clinic.id, { onDelete: 'restrict' }),
    email: text('email').notNull(),
    name: text('name').notNull(),
    // Primary role for quick lookups (denormalized). The full NIST RBAC
    // many-to-many mapping is in user_role. role_id is the "default" role
    // used when no specific role is selected; user_role captures additional
    // roles (e.g., a dentist who is also a clinic_admin).
    roleId: uuid('role_id').references(() => role.id, { onDelete: 'restrict' }),
    passwordHash: text('password_hash').notNull(),
    mfaSecret: text('mfa_secret'),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    // RLS: tenant isolation policy + ENABLE RLS.
    // FORCE RLS is added via post-migration SQL (JC-18-3).
    tenantPolicy('app_user'),
    // Tenant index for active (non-deleted) users.
    index('app_user_tenant_idx').on(table.tenantId).where(sql`deleted_at IS NULL`),
    // Email is globally unique — one user account can span multiple tenants
    // (super_admin with tenant_id=NULL, or a practitioner who works at
    // multiple clinics). Phase 5's login flow queries by email globally.
    unique('app_user_email_unique').on(table.email),
  ],
);
// enableRLS() is a method on the table object — sets the EnableRLS symbol
// so drizzle-kit generates `ALTER TABLE app_user ENABLE ROW LEVEL SECURITY`.
appUser.enableRLS();

export type AppUser = typeof appUser.$inferSelect;
export type NewAppUser = typeof appUser.$inferInsert;
