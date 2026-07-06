# @clinic-saas/patient-portal

**Phase 12+ — see [Blueprint §11.6](../../docs/blueprint-v2.0.md).**

This package is a placeholder that reserves the workspace slot for the
patient-facing portal. It is NOT a Next.js app yet — it has no `src/`,
no `app/`, no dependencies, and no `dev` script.

The patient portal will be scaffolded in Phase 12 (Algerian Integrations)
or later, once the core clinic-side EMR (Phase 10) is stable. It will be
a separate Next.js PWA with a reduced feature set:

- Patient appointment booking (read-only provider availability)
- Patient document access (prescriptions, invoices, lab results)
- Patient messaging (async, not real-time chat)
- Authentication via Better Auth (patient scope, separate from clinic staff)

All patient-portal data is tenant-scoped (patient sees only their own
records, scoped by `patient_id` in addition to `tenant_id`). RLS policies
for the patient portal will be added in Phase 13 (Security & Compliance
Hardening).

## Why a stub now?

The Roadmap v2.1 §3.8.1 says: "Create a minimal apps/patient-portal/package.json
with name @clinic-saas/patient-portal and a README noting 'Phase 12+ — see
blueprint §11.6'. Do not scaffold a Next.js app yet; this is a placeholder
to reserve the package name."

Reserving the name now avoids a rename later (the workspace map in the root
README and the ADR-002 modular-monolith scope both reference it).
