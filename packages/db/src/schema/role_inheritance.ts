// packages/db/src/schema/role_inheritance.ts
//
// Role inheritance (self-referential on role). Per Roadmap v2.1 §4.3.3 and
// Blueprint §9.2 (OpenMRS inheritance — roles inherit privileges from
// parent roles).
//
// Example: clinic_admin inherits from physician → clinic_admin has all
// physician privileges PLUS its own. super_admin inherits from clinic_admin
// (and thus transitively from physician, etc.).
//
// The PermissionsGuard (Phase 5) walks this graph to compute the effective
// privilege set for a user's role.
//
// role_inheritance is GLOBAL (not tenant-scoped).

import { pgTable, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core';

import { role } from './role';

export const roleInheritance = pgTable(
  'role_inheritance',
  {
    // The child role (inherits privileges from parent).
    childRoleId: uuid('child_role_id').notNull().references(() => role.id, { onDelete: 'cascade' }),
    // The parent role (privileges are inherited FROM parent).
    parentRoleId: uuid('parent_role_id').notNull().references(() => role.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Composite primary key — prevents duplicate inheritance edges.
    primaryKey({ columns: [table.childRoleId, table.parentRoleId] }),
    // Prevent self-inheritance (a role inheriting from itself).
    // NOTE: This check is enforced at the application layer; a CHECK
    // constraint would be ideal but Postgres doesn't support row-level
    // cross-column comparison on self-reference easily. The seed (PR D)
    // and PermissionsGuard (Phase 5) ensure no self-inheritance.
    // No tenant_id — global. No RLS.
  ],
);

export type RoleInheritance = typeof roleInheritance.$inferSelect;
export type NewRoleInheritance = typeof roleInheritance.$inferInsert;
