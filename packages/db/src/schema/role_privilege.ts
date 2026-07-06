// packages/db/src/schema/role_privilege.ts
//
// Join table: role ↔ privilege (many-to-many).
// Per Roadmap v2.1 §4.3.3 and Blueprint §9.2 (NIST RBAC).
//
// role_privilege is GLOBAL (not tenant-scoped). Role-privilege mappings are
// system-defined (e.g., the "physician" role has "patient:read:own",
// "encounter:create:own", etc.). The seed (PR D) populates the standard
// mappings.

import { pgTable, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core';

import { privilege } from './privilege';
import { role } from './role';

export const rolePrivilege = pgTable(
  'role_privilege',
  {
    roleId: uuid('role_id').notNull().references(() => role.id, { onDelete: 'cascade' }),
    privilegeId: uuid('privilege_id').notNull().references(() => privilege.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Composite primary key — prevents duplicate role-privilege pairs.
    primaryKey({ columns: [table.roleId, table.privilegeId] }),
    // No tenant_id — global. No RLS.
  ],
);

export type RolePrivilege = typeof rolePrivilege.$inferSelect;
export type NewRolePrivilege = typeof rolePrivilege.$inferInsert;
