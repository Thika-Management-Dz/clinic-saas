# AGENTS.md — Universal AI-Agent Instruction File

> Every AI coding tool that respects the 2025–2026 convention reads this file
> before writing code. It is the **single source of truth** for agent context.
> When this file is comprehensive and current, agents produce code that
> respects the architecture without being told each time. When it is thin or
> stale, agents produce plausible-looking code that violates the architecture —
> and the violations compound.

## Project Overview

**Clinic Management SaaS** — a multi-clinic, bilingual (Arabic RTL + French
LTR), offline-first, fully self-hostable EMR & practice-management SaaS for
Algeria. Serves 2 clinics at launch (one dental-only, one mixed medical +
dental) with architectural headroom for fifty. ~120 encounters per clinic per
day. Compliant with Algerian Law 18-07 (amended by Law 25-11) and Law 18-11.

The authority on architecture & data model is
[`docs/blueprint-v2.0.md`](./docs/blueprint-v2.0.md) (§X references below point
there). The authority on execution order is
[`docs/roadmap-v2.1.md`](./docs/roadmap-v2.1.md).

## Build Commands

```bash
pnpm install                 # install all workspace deps
pnpm dev                     # turbo dev (web :3000, api :3001, worker)
pnpm build                   # turbo build
pnpm lint                    # turbo lint (eslint flat config)
pnpm typecheck               # turbo typecheck (tsc --noEmit)
pnpm test                    # turbo test (Vitest)
pnpm test:e2e                # turbo test:e2e (Playwright)
pnpm db:generate             # drizzle-kit generate
pnpm db:migrate              # drizzle-kit migrate
pnpm db:studio               # drizzle-kit studio
```

Before pushing a PR: `pnpm lint && pnpm typecheck && pnpm test` must be green.

## Architecture Rules

### Multi-Tenancy — Pool Model with RLS [Blueprint §7.1]

- Every tenant-scoped table has `tenant_id UUID NOT NULL REFERENCES clinic(id)`.
- Row-Level Security is **ENABLED and FORCED** on every tenant-scoped table.
  `FORCE ROW LEVEL SECURITY` is mandatory — without it the table owner bypasses
  policies.
- The request lifecycle issues `SET LOCAL app.current_tenant = $1` at the start
  of every transaction. Every policy is
  `USING (tenant_id = current_setting('app.current_tenant')::uuid)`.
- The application DB role MUST NOT have `BYPASSRLS`. Only a reserved
  `ops_superuser` role bypasses RLS.
- RLS does NOT apply to TRUNCATE or REFERENCES — revoke TRUNCATE from the app
  role.
- Index: `CREATE INDEX ... ON <table> (tenant_id) WHERE deleted_at IS NULL`.

### Modular Monolith [Blueprint §7.2, §7.4]

- One NestJS deployment, one DB connection pool, one CI pipeline.
- A module may import ONLY another module's public API (exported via
  `index.ts`). Importing another module's internal services is a **lint error**
  (`eslint-plugin-import` `no-internal-modules`).
- Cross-module write-side effects go through `EventEmitter2` (in-process). Event
  payloads are JSON-serializable and transport-agnostic (no class instances) so
  a future extraction to a message bus requires no contract changes.

### Soft Deletes — Mandatory [Blueprint §9.1]

- Do NOT use `DELETE` on tenant-scoped or clinical tables. Use soft delete via
  `deleted_at TIMESTAMPTZ`.
- Algerian civil liability + the patient's right to access historical records
  (Law 18-07) forbid hard deletes except via a documented retention-expiry
  process. Clinical-record retention: 20 years (15-yr legal floor + 5-yr
  buffer).

### Audit Logging — Append-Only, Hash-Chained [Blueprint §9.7]

- Every mutation goes through the `AuditInterceptor`.
- `audit_log` is append-only: `REVOKE UPDATE, DELETE; allow INSERT only`.
- Each row's `hash_curr = SHA-256(prev_hash || canonical_json(this_row))`.
- Tenant-scoped via RLS. FHIR `AuditEvent`-compatible for future export.
- Retention: 6 years minimum.

### Data Residency [Blueprint §3]

- Patient-identifiable health data must reside in Algeria (Law 18-07).
- ANPDP prior authorization required for processing health data; cross-border
  transfers require separate authorization.
- `EgressGuard` interceptor blocks any outbound call carrying PII to non-sovereign
  endpoints. Sentry/PostHog scrub PII before egress (see Do-NOT list).

## i18n Rules [Blueprint §8.2, conventions/i18n.md]

- Use `next-intl`. EVERY user-visible string goes through `t()` with a message
  key. Namespaces: `patients.*`, `appointments.*`, `encounters.*`,
  `dental.*`, `billing.*`, `common.*`.
- Locales: `ar-DZ` (RTL, default), `fr-DZ` (LTR).
- Use Western Arabic numerals for both locales: `numberingSystem: "latn"`.
- The trilingual glossary (`docs/domain/glossary.md`) is the terminology source
  of truth. Use these terms consistently.
- Do NOT hardcode user-visible text — not even a single label.

## RTL Rules [Blueprint §8.2, conventions/rtl.md]

- Use Tailwind v4 **logical properties ONLY**: `ms-`, `me-`, `ps-`, `pe-`,
  `start-`, `end-`, `text-start`, `text-end`, `rounded-s-`, `rounded-e-`,
  `border-s-`, `border-e-`.
- Do NOT use physical `left`/`right` CSS properties or `ml-`/`mr-`/`pl-`/`pr-`
  Tailwind utilities for layout. (They are allowed only for truly physical
  concepts like a medical diagram.)
- shadcn/ui is configured with `rtl: true`.
- Directional icons (arrows, chevrons) must mirror in RTL (`rtl:rotate-180` or
  conditional swap).
- Do NOT call `self.skipWaiting()` in the service worker (see Do-NOT list).

## Code Style

- TypeScript throughout, strict mode (`noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `verbatimModuleSyntax`).
- ES6+ import/export. `'use client'` / `'use server'` directives where needed.
- shadcn/ui (New York style) + Lucide icons preferred over custom components.
- DB columns: `snake_case`. TS identifiers: `camelCase`. Components/types:
  `PascalCase`. Page files: `kebab-case`.
- Conventional Commits: `feat|fix|chore|docs|refactor|perf|test|build|ci`.
- Branch naming: `agent/<task-id>-<short-desc>` (AI work),
  `feat/<task-id>` (human), `fix/<task-id>` (bugfix).
- **All constructor-injected providers MUST use explicit `@Inject(Token)`
  decorators** ([ADR-013](./docs/adr/ADR-013-explicit-inject-decorators.md)).
  Example: `constructor(@Inject(HealthService) private readonly health:
  HealthService)`, NOT `constructor(private readonly health: HealthService)`.
  This is required for tsx/esbuild compatibility in dev mode — esbuild
  does not emit `emitDecoratorMetadata`, so implicit constructor
  injection is `undefined` at runtime without the explicit decorator.
  Enforcement: the `clinic-saas/require-inject` ESLint rule (catches
  violations at lint time — proactive), code review (second line of
  defense), and the `smoke` CI job (boots the API via tsx and catches
  `undefined` deps at runtime — reactive safety net).

## Dental Module Rules [Blueprint §9.4]

- Tooth numbering: **FDI Two-Digit Notation (ISO 3950:2016) ONLY**. Stored as a
  2-digit integer. Validation set:
  `{11..18, 21..28, 31..38, 41..48, 51..55, 61..65, 71..75, 81..85}`
  (permanent quadrants 1–4, primary quadrants 5–8).
- Tooth surfaces: bitfield integer — `M=1, O=2, D=4, B=8, L=16, I=32, P=64`
  (Mesial, Occlusal, Distal, Buccal, Lingual, Incisal, Palatal). A multi-surface
  restoration MOD = 1+2+4 = 7.
- Procedure codes: CDT (`D####`) as the default catalog, `code_system='local'`
  escape hatch for procedures that don't map to CDT.
- Periodontal charting: 6 sites per tooth × 32 teeth × {PD, BOP, recession,
  CAL, furcation, mobility}. Store as JSONB on a `perio_exam` row.

## Billing Rules [Blueprint §9.6]

- Per-line `tva_rate`: medical acts TVA-exempt (0%); non-medical (cosmetic,
  retail) at 9% or 19%. `tva_class` enum on the catalog:
  `medical_exempt | reduced_9 | standard_19`.
- Invoices store DGI mandatory mentions denormalized at issue time:
  `supplier_nif`, `supplier_nis`, `supplier_rc`, `patient_nif`, sequential
  `invoice_number` per tenant per year.
- Currency column defaults to `'DZD'` (never hardcoded).
- Payment providers behind a `PaymentProvider` strategy interface:
  `ChargilyAdapter` (CIB + Edahabia), `CashAdapter`, `TPEAdapter`.

## Appointment Rules [Blueprint §9.5]

- Status state machine:
  `proposed → pending → booked → arrived → in-progress → fulfilled`,
  with `cancelled` and `no-show` as terminal states. `booked` is the default
  when reception creates an appointment.
- Double-booking prevention: the booking endpoint checks for overlapping
  appointments in the same operatory with the same provider.
- Recurrence via iCal RRULE (`recurrence_rule`), `recurrence_parent_id` for
  child instances.

## Testing Conventions [conventions/testing.md]

- Vitest (unit/integration), Playwright (E2E), MSW (API mocking), axe-core
  (accessibility).
- Test pure functions: canonical JSON for the audit hash chain, FDI validation,
  TVA computation (0/9/19), RLS cross-tenant isolation.
- Every PR must pass `pnpm lint && pnpm typecheck && pnpm test`.
- E2E golden path per domain module, in BOTH locales.

## Do-NOT List (verbatim from the blueprint)

1. Do NOT use `DELETE` on tenant-scoped tables — use soft delete via `deleted_at`.
2. Do NOT auto-apply Drizzle migrations on app boot — run them explicitly via
   `pnpm db:migrate`.
3. Do NOT log patient PII in Sentry, PostHog, or `console.log`. Scrub before
   egress.
4. Do NOT hardcode user-visible text — use `next-intl`.
5. Do NOT use physical `left`/`right` CSS properties or `ml-`/`mr-`/`pl-`/`pr-`
   utilities for layout — use Tailwind logical properties.
6. Do NOT call `self.skipWaiting()` in the service worker — let the user control
   updates.
7. Do NOT store FHIR JSON internally — use lean Drizzle tables (FHIR at the
   integration boundary only, via the `NationalInteropAdapter`).
8. Do NOT use Universal (US) tooth numbering — use FDI ISO 3950:2016 only.
9. Do NOT assume the Background Sync API works in Safari — treat it as
   progressive enhancement only.
10. Do NOT import another NestJS module's internal services — only `index.ts`
    public APIs.
11. Do NOT make direct cross-module service calls for write-side effects — use
    `EventEmitter2`.
12. Do NOT add a new tenant-scoped table without `ENABLE + FORCE ROW LEVEL
    SECURITY` and a `tenant_id` index.

## AI Agent Workflow

### Picking up an issue

1. Read the issue body completely (it is a self-contained spec).
2. Check the listed file paths. Read the relevant ADRs and conventions.
3. Ask NO clarifying questions — make reasonable assumptions and document them
   in the PR description under "Assumptions".

### Structuring the PR

- One commit per logical change. Conventional-commit messages.
- Link the issue with `Closes #N` in the PR body.
- Fill in the PR template (Summary, Motivation, Changes, Test plan,
  Screenshots/recordings for UI changes, Migration included Y/N, Breaking
  change Y/N, self-verification checklist).

### Self-verification (before pushing)

```bash
pnpm lint && pnpm typecheck && pnpm test
```

### Handling uncertainty

- Leave a `// REVIEW: <question>` comment rather than guessing silently.
- Never disable RLS, audit logging, or soft deletes to make a test pass.

### Being reviewed (AI agent review session)

After your PR is opened, the operator runs a **separate** AI agent review
session against your diff. This replaces the always-on AI PR review bot from
Roadmap §2.6 (superseded by [ADR-010](./docs/adr/ADR-010.md)). The review
session enforces the same rules listed in this file and in
[`docs/runbooks/ai-agent-pr-review.md`](./docs/runbooks/ai-agent-pr-review.md).

What this means for you as the author agent:

- Expect a PR comment from the operator with a findings table
  (`PASS` / `BLOCK` / `NIT` / `N/A` per rule) and a verdict
  (`MERGE-READY` / `FIX-NEEDED`).
- If the comment lists `BLOCK` findings, address them on the same branch, push,
  and the operator will re-run the session. Do not argue with the review in
  comments — fix the code or leave a `// REVIEW:` comment explaining why the
  finding is a false positive.
- Do not self-approve. The review session is a fresh-context pass; your own
  self-verification (above) is a first line of defense, not a substitute.
- The review comment is part of the audit trail — do not request its deletion.

## Domain Glossary

See [`docs/domain/glossary.md`](./docs/domain/glossary.md) for the trilingual
(FR/AR/EN) terminology source of truth. Key terms: patient (مريض / patient),
appointment (موعد / rendez-vous), encounter (استشارة / consultation),
prescription (وصفة طبية / ordonnance), odontogram (مخطط أسنان / odontogramme),
invoice (فاتورة / facture), operatory (كرسي / fauteuil), practitioner
(ممارس / praticien), vitals (المؤشرات الحيوية / constantes), allergy
(حساسية / allergie), medication (دواء / médicament), TVA (ضريبة القيمة
المضافة / TVA), NIF (الرقم الجبائي / NIF), NIS (الرقم الإحصائي / NIS),
RC (السجل التجاري / RC).

## ADRs

See [`docs/adr/`](./docs/adr/). Decisions are Accepted unless noted. Any new
architecture decision requires a new ADR (next number) before implementation.
Notable: [ADR-010](./docs/adr/ADR-010.md) supersedes Roadmap §2.6 — the project
uses a manual AI agent review session per PR instead of an always-on AI PR
review bot.

## Runbooks

- [`docs/runbooks/breach-response.md`](./docs/runbooks/breach-response.md) —
  ANPDP 5-day SLA (Law 25-11).
- [`docs/runbooks/backup-recovery.md`](./docs/runbooks/backup-recovery.md) —
  pgBackRest restore, 3-2-1-1-0.
- [`docs/runbooks/dexie-to-powersync-migration.md`](./docs/runbooks/dexie-to-powersync-migration.md)
  — v1 → v2 sync migration.
- [`docs/runbooks/ai-agent-pr-review.md`](./docs/runbooks/ai-agent-pr-review.md)
  — how to run an AI agent review session on a PR (replaces the review bot per
  ADR-010).

## Worker / Offline App Notes

- v1 offline: Dexie (IndexedDB) + sync outbox + LWW conflict resolution with
  server-authoritative `updated_at`. [Blueprint §10, ADR-005]
- Service worker via Serwist. Update flow: prompt the user; never auto-skip
  waiting.
- Background Sync API is progressive enhancement only (no Safari guarantee).
