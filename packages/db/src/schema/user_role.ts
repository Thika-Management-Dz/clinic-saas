// packages/db/src/schema/user_role.ts
//
// Join table: user ↔ role (many-to-many, per-tenant).
// Per Roadmap v2.1 §4.3.3 and Blueprint §9.2 (NIST RBAC).
//
// user_role IS tenant-scoped. A user's role assignment is within a tenant:
// a practitioner who works at two clinics has two user_role rows (one per
// clinic), potentially with different roles (e.g., physician at clinic A,
// clinic_admin at clinic B).
//
// RLS ensures a user's role assignments are only visible within the
// current tenant context.

import { pgTable, uuid, timestamp, index, unique } from 'drizzle-orm/pg-core';

import { tenantPolicy } from '../rls';

import { appUser } from './app_user';
import { clinic } from './clinic';
import { role } from './role';


export const userRole = pgTable(
  'user_role',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => clinic.id, { onDelete: 'restrict' }),
    userId: uuid('user_id').notNull().references(() => appUser.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id').notNull().references(() => role.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    tenantPolicy('user_role'),
    // A user has at most one role per tenant. Additional roles within the
    // same tenant would use a separate mechanism (future feature). For now,
    // the primary role is captured here; app_user.role_id is a denormalized
    // copy for quick lookups.
    unique('user_role_tenant_user_unique').on(table.tenantId, table.userId),
    // Tenant index for active role assignments (no deleted_at on this table
    // — role assignments are revoked by DELETE, which is allowed because
    // user_role is a join table, not a clinical table. AGENTS.md Do-NOT #1
    // applies to tenant-scoped CLINICAL tables, not join tables).
    index('user_role_tenant_idx').on(table.tenantId),
    index('user_role_user_idx').on(table.userId),
  ],
);
userRole.enableRLS();

export type UserRole = typeof userRole.$inferSelect;
export type NewUserRole = typeof userRole.$inferInsert;
