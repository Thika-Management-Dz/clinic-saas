// packages/db/src/schema/role.ts
//
// Role definitions. Per Roadmap v2.1 §4.3.3 and Blueprint §9.2 (NIST RBAC +
// OpenMRS inheritance + OpenEMR resource:action:scope).
//
// role is GLOBAL (not tenant-scoped). Roles are system-defined and shared
// across all tenants. The seed (Phase 4.5.3, PR D) creates the standard
// hierarchy: super_admin → clinic_admin → physician/dentist/dental_assistant/
// nurse/receptionist/billing/pharmacist.
//
// Per-tenant role customization (e.g., clinic A defines a custom "triage
// nurse" role) is a future feature — not in Phase 4 scope. When added,
// custom roles would get a tenant_id column and RLS; system roles would
// remain global.

import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';

export const role = pgTable(
  'role',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Slug-like key for code references (e.g., 'clinic_admin'). Stable
    // across renames; the display name is in `name`/`name_ar`.
    key: text('key').notNull().unique(),
    name: text('name').notNull(),
    nameAr: text('name_ar'),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // No tenant_id — roles are global. No RLS.
    // No deleted_at — roles are not soft-deleted (they're system-defined).
    // A deprecated role is marked via a `deprecated` column (future).
    index('role_key_idx').on(table.key),
  ],
);

export type Role = typeof role.$inferSelect;
export type NewRole = typeof role.$inferInsert;
