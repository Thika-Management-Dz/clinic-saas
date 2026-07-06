# Naming Conventions

- **Audience:** AI coding agents and human contributors
- **Blueprint references:** §9 (data model), §7.4 (module structure); Roadmap §2.1.4
- **Enforcement:** ESLint + Drizzle Kit + CI

Consistent naming is a **clinical safety property**. A receptionist reading
an audit-log entry, an engineer grepping for a column, and an AI agent
writing a new schema must all use the same names. This file is the single
source of truth.

## 1. By layer

| Layer | Convention | Example |
|---|---|---|
| PostgreSQL columns | `snake_case` | `family_name`, `tooth_fdi`, `created_at`, `tenant_id` |
| PostgreSQL tables | `snake_case`, singular | `patient`, `appointment`, `invoice_line`, `audit_log` |
| PostgreSQL indexes | `<table>_<col(s)>_idx` | `patient_tenant_idx`, `patient_tenant_name_idx` |
| PostgreSQL RLS policies | `tenant_isolation` (per table) | `CREATE POLICY tenant_isolation ON patient …` |
| TypeScript variables, functions | `camelCase` | `const patientId = …`, `function computeLineTotals()` |
| TypeScript constants | `camelCase` (preferred) or `SCREAMING_SNAKE_CASE` for true constants | `const TvaRates = [0, 9, 19] as const;` |
| TypeScript types, interfaces, classes | `PascalCase` | `type Patient`, `interface PaymentProvider`, `class ChargilyPayAdapter` |
| React components | `PascalCase` | `<PatientList />`, `<OdontogramChart />` |
| React hooks | `use` + `camelCase` | `usePatients()`, `useTenant()` |
| Files — pages (App Router) | `kebab-case` for routes, `page.tsx` for the page file | `apps/web/app/[locale]/patients/[id]/page.tsx` |
| Files — components | `kebab-case` for the file, PascalCase for the default export | `patient-list.tsx` exports `PatientList` |
| Files — utilities, hooks | `kebab-case` | `format-money.ts`, `use-toast.ts` |
| Files — NestJS modules | `kebab-case` directory, `*.module.ts`, `*.service.ts`, `*.controller.ts` | `modules/patient/patient.module.ts` |
| Files — Drizzle schema | `<domain>.ts` per module | `modules/patient/schema/patient.ts` |
| Files — tests | `<file-under-test>.test.ts` co-located | `tva.ts` + `tva.test.ts` |
| Environment variables | `SCREAMING_SNAKE_CASE` | `DATABASE_URL`, `BETTER_AUTH_SECRET` |
| Config keys (JSON/json5/yaml) | `camelCase` or `kebab-case` per ecosystem | renovate uses `kebab-case`; our own config uses `camelCase` |

## 2. Database-specific rules

### 2.1 Every tenant-scoped table follows the standard column set [Blueprint §9.1]

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID PK DEFAULT gen_random_uuid()` | |
| `tenant_id` | `UUID NOT NULL REFERENCES clinic(id)` | RLS-enforced |
| `created_at` | `TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()` | |
| `updated_at` | `TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()` | Server-authoritative for LWW (ADR-005) |
| `deleted_at` | `TIMESTAMPTZ` | soft delete — never hard-delete tenant-scoped rows |
| `created_by` | `UUID REFERENCES app_user(id)` | |

### 2.2 Tooth columns are `tooth_fdi INT` [ADR-007]

| ❌ Don't | ✅ Do |
|---|---|
| `tooth_number VARCHAR(2)` | `tooth_fdi INT` with CHECK constraint |
| `tooth TEXT` | `tooth_fdi INT` |
| `tooth_universal INT` | `tooth_fdi INT` (Universal is display-only, never stored) |

Validation set enforced at the DB layer:
`CHECK (tooth_fdi IN (11..18, 21..28, 31..38, 41..48, 51..55, 61..65, 71..75, 81..85))`.

### 2.3 Tooth surfaces are a bitfield INT [Blueprint §9.4.2]

| ❌ Don't | ✅ Do |
|---|---|
| `surfaces TEXT[]` (array of 'M','O','D') | `surfaces_bitfield INT` |
| `surfaces JSONB` | `surfaces_bitfield INT` |
| Separate boolean columns `is_mesial`, `is_distial`, … | `surfaces_bitfield INT` |

Bit assignments: `M=1, O=2, D=4, B=8, L=16, I=32, P=64`. Use
`decodeSurfaces()` / `encodeSurfaces()` helpers in `packages/contracts`.

### 2.4 Money columns

- `numeric(12, 2)` — never `real` / `double precision` for money.
- Column suffix `_ht` (hors taxe, before tax), `_tva` (TVA amount),
  `_ttc` (toutes taxes comprises, after tax). Example: `unit_price_ht`,
  `line_total_ttc`.
- Currency is a column (`currency TEXT NOT NULL DEFAULT 'DZD'`), never
  hardcoded.

### 2.5 Status / enum columns

- Stored as `TEXT` with a CHECK constraint listing allowed values
  (e.g., `status TEXT NOT NULL CHECK (status IN ('draft','issued','paid','partial','refunded','void'))`).
- Not Postgres `ENUM` type — ENUMs make migrations painful (cannot remove a
  value without dropping the type).

## 3. TypeScript-specific rules

- **No** `I` prefix on interfaces (`Patient`, not `IPatient`) — the
  TypeScript convention since 2014.
- **No** `T` prefix on generic types (`Result<T, E>`, not `TResult<T, E>`).
- Use `type` for unions and aliases; `interface` for object shapes that may
  be implemented by classes.
- Use `Result<T, E>` (a discriminated union) for fallible operations
  instead of throwing — see `packages/contracts/src/shared/result.ts`.

## 4. Branch naming [Roadmap §2.1.4]

| Branch type | Pattern | Use case |
|---|---|---|
| AI-agent work | `agent/<task-id>-<short-desc>` | Default for AI coding-agent tasks (e.g., `agent/3-a-governance-docs`) |
| Human feature | `feat/<task-id>` | Human-directed feature work (e.g., `feat/4-odontogram-editor`) |
| Bugfix | `fix/<task-id>` | Bug fixes (e.g., `fix/5-rls-policy-drift`) |
| Chore | `chore/<short-desc>` | Dependency bumps, refactors with no behavior change |
| Release | `release/v<x.y.z>` | Release prep |

Examples: `agent/3-a-governance-docs`, `feat/10-dental-odontogram`,
`fix/12-invoice-tva-rounding`, `chore/renovate-bump-next`.

## 5. Commit messages — Conventional Commits

Every commit message follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Allowed types

| Type | When |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Tooling, deps, refactors with no behavior change |
| `docs` | Documentation only |
| `refactor` | Code restructure with no behavior change |
| `perf` | Performance improvement |
| `test` | Test additions or fixes |
| `build` | Build system, dependencies, monorepo config |
| `ci` | CI/CD pipeline changes |
| `revert` | Revert a previous commit |

### Examples

```
feat(dental): add FDI-validated odontogram editor
fix(billing): round TVA to 2 decimals on line totals
chore(deps): bump next 16.2.3 → 16.2.4 (renovate)
docs(adr): add ADR-009 licensing strategy
test(rls): assert FORCE ROW LEVEL SECURITY on every tenant table
ci: add Lighthouse CI gate on PR
```

- `<scope>` is the domain module (`patient`, `appointment`, `dental`,
  `billing`, `audit`, `auth`, `rls`, …) or `deps` / `ci` / `adr` for
  cross-cutting work.
- Subject line ≤ 72 chars, imperative mood (`add`, not `added` / `adds`).
- Reference the issue in the footer: `Closes #42`.

### Squash-merge

PRs are squash-merged (Roadmap §0). The squash-commit message becomes the
canonical commit on `main`; the PR author edits it to Conventional Commits
format before merge.

## 6. PR naming

- The PR title is the squash-commit subject — Conventional Commits format.
- Link the issue: `Closes #<task-id>` in the PR body.

## 7. Tags / releases

- Tags: `v<major>.<minor>.<patch>` (semver), e.g., `v0.1.0`, `v1.0.0-rc.1`.
- Release notes generated from Conventional Commits via
  `changesets` or `semantic-release` (TBD in Roadmap Phase 7).

## 8. Anti-patterns

| ❌ Don't | ✅ Do |
|---|---|
| `tbl_patient`, `tbl_user` (Hungarian-style prefix) | `patient`, `app_user` |
| `toothNo`, `tooth_id` (Universal) | `tooth_fdi` |
| `surfacesArray`, `surfaces` (TEXT[]) | `surfaces_bitfield` |
| `PatientService` for a function | `computeLineTotals` (function) or `class PatientService` (class) |
| `IPatient` interface | `Patient` interface |
| `feat-add-patient-search` branch | `feat/10-patient-search` |
| `updated: fix stuff` commit | `fix(patient): correct diacritic-insensitive search` |
| Hardcoded `'|'` separator in `audit_log.action` | Convention: `'<entity>.<verb>'` (e.g., `patient.update`, `login.success`) |
