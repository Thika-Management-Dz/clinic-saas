// packages/db/src/schema/clinic.ts
//
// The tenant entity. Per Roadmap v2.1 §4.3.1 and ADR-001.
//
// clinic is NOT tenant-scoped (it IS the tenant). It has no tenant_id column
// and no RLS policy. Every authenticated user can read the clinic list (to
// know which tenants exist for the tenant-switcher UI). Writes to clinic
// (creating/editing a clinic) are restricted to ops_superuser via the
// application layer (Phase 5 PermissionsGuard).
//
// Soft deletes: deleted_at TIMESTAMPTZ. Per AGENTS.md Do-NOT #1, never
// hard-DELETE a clinic — soft-delete and retain for the 20-year clinical
// record retention period (Blueprint §9.1).

import { sql } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';

export const clinic = pgTable(
  'clinic',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    nameAr: text('name_ar'),
    licenseNumber: text('license_number'),
    address: text('address'),
    phone: text('phone'),
    email: text('email'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    // Index for active (non-deleted) clinics. Clinic count is small (2-50),
    // but the index supports the tenant-switcher UI which lists active clinics.
    // Indexed on `name` so the tenant-switcher can list alphabetically.
    index('clinic_active_name_idx').on(table.name).where(sql`deleted_at IS NULL`),
  ],
);

export type Clinic = typeof clinic.$inferSelect;
export type NewClinic = typeof clinic.$inferInsert;
