// packages/db/src/schema/index.ts
//
// Drizzle schema barrel. Per Roadmap v2.1 §4.3.6.
//
// Re-exports all schema files so apps/api can import via:
//   import { clinic, appUser, auditLog } from '@clinic-saas/db/schema';
//
// Every tenant-scoped table MUST have:
//   - tenant_id UUID NOT NULL REFERENCES clinic(id)
//     (exception: app_user has nullable tenant_id for super_admin)
//   - ENABLE + FORCE ROW LEVEL SECURITY (per ADR-001)
//   - tenant_id index WHERE deleted_at IS NULL
//   - deleted_at TIMESTAMPTZ (soft delete per Blueprint §9.1)
//
// Phase 4 tables (this file):
//   - clinic            (tenant entity — NOT tenant-scoped, no RLS)
//   - app_user          (tenant-scoped, nullable tenant_id for super_admin)
//   - role              (global — no RLS)
//   - privilege         (global — no RLS)
//   - role_privilege    (global — no RLS)
//   - role_inheritance  (global — no RLS)
//   - user_role         (tenant-scoped)
//   - audit_log         (tenant-scoped, append-only)
//
// Phase 5 tables (Better Auth — per ADR-004):
//   - user              (auth — NOT tenant-scoped, no RLS)
//   - session           (auth — NOT tenant-scoped, no RLS)
//   - account           (auth — NOT tenant-scoped, no RLS)
//   - verification      (auth — NOT tenant-scoped, no RLS)
//   - organization      (auth — maps to clinic/tenant)
//   - member            (auth — user↔organization membership)
//   - invitation        (auth — org invitation)

export * from './clinic';
export * from './app_user';
export * from './role';
export * from './privilege';
export * from './role_privilege';
export * from './role_inheritance';
export * from './user_role';
export * from './audit_log';
export * from './auth';
