// packages/db/src/schema/index.ts
//
// Drizzle schema barrel. Phase 3 scaffold: empty.
//
// Schema files added in subsequent phases (per Roadmap v2.1 §3.9.2):
//   - clinic.ts        (Phase 4 — tenant + RLS foundation)
//   - app_user.ts      (Phase 5 — Authentication & Tenant Interceptor)
//   - role.ts          (Phase 5)
//   - audit_log.ts     (Phase 4 — append-only, hash-chained)
//   - patient.ts       (Phase 10 — Core Domain Modules)
//   - encounter.ts     (Phase 10)
//   - dental.ts        (Phase 10 — FDI ISO 3950:2016 tooth notation)
//   - appointment.ts   (Phase 10)
//   - invoice.ts       (Phase 11 — Billing + Chargily Pay)
//
// Every tenant-scoped table MUST have:
//   - tenant_id UUID NOT NULL REFERENCES clinic(id)
//   - ENABLE + FORCE ROW LEVEL SECURITY (per ADR-001)
//   - tenant_id index WHERE deleted_at IS NULL
//   - deleted_at TIMESTAMPTZ (soft delete per Blueprint §9.1)

export {};
