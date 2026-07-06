// packages/db/src/schema/privilege.ts
//
// Privilege definitions. Per Roadmap v2.1 §4.3.3 and Blueprint §9.2
// (OpenEMR resource:action:scope strings).
//
// privilege is GLOBAL (not tenant-scoped). Privileges are system-defined
// strings like "patient:read:own" (read patients in your own clinic) or
// "patient:read:all" (read patients across all clinics — super_admin only).
//
// The resource:action:scope format:
//   resource  — the entity type (patient, encounter, invoice, etc.)
//   action    — the operation (create, read, update, delete, export, etc.)
//   scope     — the data scope (own = own clinic, all = all clinics, none)

import { pgTable, uuid, text, timestamp, index, unique } from 'drizzle-orm/pg-core';

export const privilege = pgTable(
  'privilege',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // The resource:action:scope string, e.g., "patient:read:own".
    // Unique — each privilege string appears exactly once.
    key: text('key').notNull(),
    // Parsed components for convenience (denormalized from key).
    resource: text('resource').notNull(),
    action: text('action').notNull(),
    scope: text('scope').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('privilege_key_unique').on(table.key),
    index('privilege_resource_action_idx').on(table.resource, table.action),
  ],
);

export type Privilege = typeof privilege.$inferSelect;
export type NewPrivilege = typeof privilege.$inferInsert;
