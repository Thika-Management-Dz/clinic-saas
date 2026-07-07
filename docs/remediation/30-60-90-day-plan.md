# Remediation Roadmap — 30 / 60 / 90 Day Plan

> **Source:** [`docs/audits/2026-07-07-critical-review.pdf`](../audits/2026-07-07-critical-review.pdf) (section 9, "Remediation Roadmap (30 / 60 / 90 days)").
> **Tracking:** this doc tracks the status of each remediation item. Update the status when a PR addresses an item.
> **Convention:** status is one of `pending` / `in-progress` / `done` / `deferred`. Link the PR when `done`.

## 30-day blockers (must do before Phase 5)

Per the critical review: "The 30-day items are blocking — do not start Phase 5 until they are done."

| # | Fix | Effort | Status | PR / Notes |
|---|-----|--------|--------|------------|
| 30-1 | Add `.github/workflows/ci.yml` with lint+typecheck+test+integration (Postgres service container). Pin actions to SHA, not tag. | 1 day | done | PR #28 (Task 20-a) — `.github/workflows/ci.yml` with 4 jobs (lint, typecheck, test-scripts, integration), actions pinned to SHA, Postgres 17 service container with 001_roles + drizzle migrate + 003_force_rls + 002_audit_log_immutable setup |
| 30-2 | Add branch protection requiring CI green + 1 review before merge to main. | 30 min | done | PR #28 (Task 20-a) — main-protection ruleset (ID 18567129) verified at full strictness with the `required_status_check` rule added (5 checks: integration, lint, typecheck, test-scripts, gitleaks). Verified with fresh GET after merge. |
| 30-6 | Write `SECURITY.md` with vulnerability disclosure policy and contact. | 1 hour | done | PR #28 (Task 20-a) — `SECURITY.md` at repo root with GitHub Security Advisories channel, response SLA table (48h ack, 7d P0, 30d P1, 60d P2, 90d P3), ANPDP 5-day SLA reference, secret hygiene section |
| 30-7 | Add gitleaks pre-commit hook + enable GitHub secret scanning. | 1 hour | done | PR #28 (Task 20-a) — `.pre-commit-config.yaml` (gitleaks-docker hook @v8.30.1) for local hygiene + `.github/workflows/gitleaks.yml` (gitleaks binary v8.30.1 run directly with SHA256 verification, no GITLEAKS_LICENSE needed) for the CI machine gate |
| 30-8 | Pin Orthanc docker image to a specific version (not `:latest`). | 15 min | done | PR #28 (Task 20-a) — `docker-compose.yml` changed `orthancteam/orthanc:latest` → `orthancteam/orthanc:26.6.1` (latest stable at PR time) |
| 30-3 | Rotate dev DB creds: read from env in `001_roles.sql` via `:var` substitution; add fail-fast in `main.ts` if `NODE_ENV=production` and `DATABASE_URL` contains `dev_password`. | 2 hours | pending | Deferred to a small PR after PR1+PR2 (the dev creds are dev-only; staging/prod use `.env.staging` per ADR-011) |
| 30-4 | Fix `withTenant`: add UUID regex validation before string interpolation; document the Phase 5 `TenantInterceptor` must use parameterized `set_tenant()` function. | 1 hour | done | PR #29 (Task 20-b) — `withTenant` in helpers.ts now validates UUID regex before interpolation; comment documents that Phase 5's TenantInterceptor MUST use `set_tenant(uuid)` instead |
| 30-5 | Fix audit log hash chain: per-tenant `prev_hash` lookup (`WHERE tenant_id = NEW.tenant_id`); add `LOCK TABLE` or advisory lock to serialize per-tenant INSERTs. | 4 hours | done | PR #29 (Task 20-b) — `compute_audit_hash_curr()` redesigned with per-tenant `WHERE tenant_id = NEW.tenant_id` lookup + `pg_advisory_xact_lock(hashtext(NEW.tenant_id::text))` serialization. Also fixes P0-5 (SECURITY DEFINER cross-tenant coupling) |

**Total 30-day effort:** ~5 days for a single engineer. None of it is architecturally hard — it is process hygiene.

## 60-day high-severity fixes

Per the critical review: "The 60-day items should land before any external contributor touches the repo."

| # | Fix | Effort | Status | PR / Notes |
|---|-----|--------|--------|------------|
| 60-1 | Migrate `hash_curr`/`hash_prev` from TEXT to BYTEA when Drizzle supports it (or raw SQL migration). | 1 day | deferred | JC-18-4 — deferred until Drizzle adds bytea support; PR2's per-tenant redesign does not depend on this |
| 60-2 | Add `@clinic-saas/db` barrel exports: `export { clinic, appUser, auditLog, role, ... } from index.ts`. | 30 min | pending | |
| 60-3 | Add real health checks: DB ping, Redis ping, Orthanc ping; expose `/healthz` and `/readyz` separately. | 4 hours | pending | |
| 60-4 | Add Fastify body size limit, CORS config, and rate limiting in `apps/api/src/main.ts`. | 1 day | pending | |
| 60-5 | Add `updated_at` auto-update trigger (PL/pgSQL function + AFTER UPDATE trigger on every table with `updated_at`). | 4 hours | pending | |
| 60-6 | Convert `audit_log.outcome` to enum; add CHECK constraints on `action`, `entity_type`. | 4 hours | pending | |
| 60-7 | Add `role_inheritance` cycle prevention (recursive CTE in a BEFORE INSERT/UPDATE trigger). | 4 hours | pending | Also flagged as a Phase 4 NIT by Task 19-a (PR #20 review, comment 4899185938) |
| 60-8 | Add CLA + cla-bot before accepting external contributions. | 1 day | deferred | Only needed before external contributors — bus factor = 1 means no external contributors yet |
| 60-9 | Split `WORKLOG.md` into per-phase files in `docs/worklog/`. | 2 hours | pending | WORKLOG.md is now 846 lines after Task 19-b; ~30K tokens for an AI agent to read |
| 60-10 | Add Docker image scanning (trivy in CI). | 2 hours | pending | Builds on PR1's CI workflow |

## 90-day quality improvements

Per the critical review: "The 90-day items are quality-of-life improvements that will pay dividends as the codebase grows."

| # | Fix | Effort | Status | PR / Notes |
|---|-----|--------|--------|------------|
| 90-1 | Add `version` column to all tenant-scoped tables for optimistic concurrency (Phase 8 prep). | 1 day | deferred | Phase 8 (offline sync) prep |
| 90-2 | Add `created_by` / `updated_by` UUID columns to all tenant-scoped tables. | 1 day | pending | Compliance requirement (HIPAA, ISO 27001, Law 18-07) |
| 90-3 | Add partial index on `audit_log WHERE outcome = 'failure'`. | 30 min | pending | |
| 90-4 | Redesign `app_user` to separate login table (no RLS) from tenant-scoped profile. | 2 days | deferred | Phase 5 will need this for super_admin login flow (P0-6) |
| 90-5 | Start ANPDP filing process (multi-month); appoint DPO; begin DPIA completion. | ongoing | pending | Operator + legal — not a code task |
| 90-6 | Hire or contract a second engineer with commit access (bus factor = 1 is critical risk). | ongoing | pending | Operator business decision — not a code task |
| 90-7 | Implement `EgressGuard` interceptor stub (Phase 13 prep). | 2 days | deferred | Phase 13 |
| 90-8 | Add Storybook for `packages/ui`. | 1 day | deferred | Phase 6 |
| 90-9 | Add axe-core accessibility tests in both locales (ar-DZ RTL + fr-DZ LTR). | 2 days | deferred | Phase 6+ |
| 90-10 | Document the staging/prod DB credential rotation procedure in `docs/runbooks/`. | 4 hours | done | PR #26 (Task 19-b) — `docs/runbooks/neon-staging.md` §"Rotate the Neon DB password if it leaks" |

## P0 / P1 findings not in the 30/60/90 list

These are findings from the critical review that are not explicitly in the section-9 roadmap but are tracked here for completeness:

| Finding | Severity | Status | PR / Notes |
|---------|----------|--------|------------|
| No CI/CD workflows | P0 | done | PR #28 (Task 20-a, 30-1) — `.github/workflows/ci.yml` with 4 jobs + `.github/workflows/gitleaks.yml` |
| Dev DB credentials committed in plaintext | P0 | partial | 30-3 — partially addressed by PR #26 (rotation procedure documented in neon-staging.md); SQL file itself still has literals |
| SQL injection pattern in `withTenant` helper | P0 | done | PR #29 (Task 20-b, 30-4) — UUID regex validation + comment documenting Phase 5 must use `set_tenant(uuid)` |
| Audit log hash chain race condition | P0 | done | PR #29 (Task 20-b, 30-5) — per-tenant `prev_hash` lookup + `pg_advisory_xact_lock` serialization |
| SECURITY DEFINER cross-tenant function | P0 | done | PR #29 (Task 20-b, 30-5) — per-tenant redesign fixes both P0-4 and P0-5 |
| `app_user` nullable `tenant_id` without super_admin login flow | P0 | deferred | 90-4 (Phase 5) — the schema comment acknowledges the trap; Phase 5's login flow must solve it |
| No GitHub branch protection (visible in repo) | P1 | done | Main-protection ruleset (ID 18567129) at full strictness with required_status_check rule (5 checks: integration, lint, typecheck, test-scripts, gitleaks) added in PR #28 (Task 20-a, 30-2). Verified with fresh GET. |
| No `SECURITY.md` | P1 | done | PR #28 (Task 20-a, 30-6) — `SECURITY.md` at repo root |
| No secrets scanning automation | P1 | done | PR #28 (Task 20-a, 30-7) — `.pre-commit-config.yaml` (gitleaks-docker) + `.github/workflows/gitleaks.yml` (gitleaks binary v8.30.1) |
| DPIA is a stub | P1 | pending | 90-5 — operator + legal |
| `hash_curr` stored as TEXT (hex) not BYTEA | P1 | deferred | 60-1 (JC-18-4) |
| No request size limits on Fastify | P1 | pending | 60-4 |
| Health check is fake | P1 | pending | 60-3 |
| Worker has `REDIS_URL` fallback to localhost | P1 | pending | 60-3 / 60-4 — fail-fast in production |
| No CLA / contributor licensing | P1 | deferred | 60-8 |
| No Docker image scanning | P1 | pending | 60-10 |

## How to update this doc

When a PR addresses an item:
1. Change the status to `done` (or `in-progress` while the PR is open).
2. Link the PR in the "PR / Notes" column.
3. If the PR partially addresses an item, mark it `partial` and note what remains.

When a new finding is discovered (e.g., in a future audit), add it to the "P0 / P1 findings not in the 30/60/90 list" table.

This doc is the single source of truth for remediation tracking. The critical review PDF is the authoritative source for the findings themselves; this doc tracks the *status* of addressing them.
