# Worklog — Phase 4: DB & RLS Foundation

> Summarized archive of AI-agent sessions for Phase 4. Source: original
> `WORKLOG.md` (pre-split, 2026-07-08, commit `f9192a5b`). For full session
> transcripts, see `git log --grep="Task 18"` or the PRs linked below.

## Phase outcome

Phase 4 delivered the local Postgres 17 + Redis + Orthanc docker-compose
stack, the Drizzle schema for 8 tables (clinic, app_user, role,
privilege, role_privilege, role_inheritance, user_role, audit_log), RLS
policies on all 3 tenant-scoped tables, FORCE RLS via a SQL file (Drizzle
0.40.1 has no `forceRLS()` API), audit_log immutability + per-tenant
hash chain, an idempotent seed, 19 Vitest tests (the compliance gate —
all green), and Neon staging setup docs. The phase was driven off a
remote Neon free-tier Postgres 17 because the agent sandbox has no
Docker.

## Key decisions

- **JC-18-1:** `POSTGRES_USER=postgres` (not `app_role` as Roadmap §4.1.1
  specified). Avoids the chicken-and-egg problem where `app_role` would
  become a momentary superuser during initdb. `app_role` and
  `ops_superuser` are created from scratch with correct privileges;
  `app_role` is NEVER a superuser. Operator uses
  `docker compose exec postgres psql -U postgres` for admin sessions.
- **JC-18-2 (superseded by 30-3 / PR #31):** dev passwords were
  initially committed as non-sensitive dev-only defaults. Later rotated
  out via psql `:var` substitution in PR #31 — SQL file now has zero
  plaintext credentials, `main.ts` adds production fail-fast
  (`assertNoDevCredentialsInProduction()`).
- **JC-18-3 (REMEDIATED in PR #22):** Drizzle 0.40.1 has no `forceRLS()`
  API — the migration has `ENABLE ROW LEVEL SECURITY` but NOT `FORCE
  ROW LEVEL SECURITY` (without FORCE, table owner `ops_superuser`
  bypasses RLS). Remediated via `packages/db/sql/003_force_rls.sql`. The
  PR E CI test (`SELECT relforcerowsecurity FROM pg_class`) verifies.
- **JC-18-4 (deferred to 60-1):** audit_log hash columns use `text`
  (hex) instead of `bytea` because Drizzle 0.40.1 has no built-in `bytea`
  type. SHA-256 = 32 bytes = 64 hex chars. ~128 bytes overhead per row —
  negligible.
- **JC-18-5 (Neon-specific):** On Neon, `ops_superuser` couldn't
  `CREATE TABLE` (missing schema CREATE privileges), and `neondb_owner`
  couldn't GRANT itself to `ops_superuser` (Neon restricts). Solution:
  run migrations as `neondb_owner` on Neon (equivalent for RLS — both
  roles have BYPASSRLS). On docker-compose, migrations run as
  `ops_superuser` as designed.
- **`tenantPolicy()` helper** in `packages/db/src/rls.ts` uses the NULLIF
  pattern: `tenant_id = NULLIF(current_setting('app.current_tenant',
  true), '')::uuid`. Returns NULL when setting is missing/empty → app
  MUST set `app.current_tenant` before querying.
- **audit_log immutability:** `REVOKE UPDATE/DELETE ON audit_log FROM
  app_role + PUBLIC`. `compute_audit_hash_curr()` PL/pgSQL function
  (SECURITY DEFINER, SET search_path=public) builds canonical JSON via
  `jsonb_build_object`, computes `SHA-256(prev_hash || canonical_json)`.
  BEFORE INSERT trigger. Seed: 2 clinics, 9 roles, 8 inheritance edges, 3
  users (idempotent via `ON CONFLICT DO NOTHING`).
- **`withTenant()` test helper** uses `SET LOCAL app.current_tenant` in a
  transaction with auto-rollback. (PR #29 / Task 20-b later added UUID
  regex validation to fix P0-3 — see post-phase-4 worklog.)
- **ADR-011 (3-tier secrets posture, accepted in Task 19-b):** Tier 1 =
  gitignored `.env.staging` now; Tier 2 = GitHub Actions encrypted
  secrets for CI in Phase 7; Tier 3 = on-host `.env` + systemd
  `LoadCredential` for production in Phase 16. Doppler Service Tokens
  require Team plan (~$99/mo) — operator deferred Doppler to post-revenue.

## Sessions

| Task ID | Agent | PR | Summary |
|---------|-------|----|---------|
| 18-a | Super Z (PR A — docker-compose + roles) | PR #18 | `docker-compose.yml` (postgres 17-alpine + redis 7-alpine + orthanc), `001_roles.sql` (ops_superuser BYPASSRLS, app_role NOBYPASSRLS, REVOKE TRUNCATE), updated `.env.example`. No DB in sandbox — runtime verification deferred. |
| 18-b | Super Z (PR B — Drizzle schema + RLS) | PR #20 | 8 schema files + `rls.ts` `tenantPolicy()` + barrel. 3 tenant-scoped tables have `enableRLS()` + tenantPolicy + tenant_id index. JC-18-3 (forceRLS absent) + JC-18-4 (hash columns text not bytea). |
| 18-c | Super Z (PR C — first migration + FORCE RLS) | PR #22 | Operator provided Neon free-tier Postgres 17. Generated + applied first migration. Created `003_force_rls.sql`. 6-test RLS smoke: cross-tenant isolation PROVEN. JC-18-3 REMEDIATED. |
| 18-d | Super Z (PR D — audit immutability + hash chain + seed) | PR #23 | `002_audit_log_immutable.sql` (pgcrypto + REVOKE UPDATE/DELETE + `compute_audit_hash_curr()` PL/pgSQL function + BEFORE INSERT trigger). `seed.ts` (2 clinics, 9 roles, 8 edges, 3 users). 5-test audit smoke: immutability + hash chain PROVEN. |
| 18-e | Super Z (PR E — Vitest RLS + audit tests — COMPLIANCE GATE) | PR #24 | 19 Vitest tests (13 RLS + 6 audit_log). Hash-chain recompute runs IN POSTGRES. 19/19 PASS on Neon (32s). Compliance gate GREEN. |
| 18-f | Super Z (PR F — Neon staging docs) | PR #25 | Created `docs/runbooks/neon-staging.md` (what the agent did + what operator must do per ADR-011). Phase 4 COMPLETE. |

## Open follow-ups (still open as of 2026-07-08)

- **JC-18-4 / 60-1:** Migrate `hash_curr`/`hash_prev` from TEXT to BYTEA
  when Drizzle supports it. Status: `deferred`.
- **60-2:** `@clinic-saas/db` barrel exports. · **60-5:** `updated_at`
  auto-update trigger. · **60-6:** `audit_log.outcome` enum + CHECKs. ·
  **60-7:** `role_inheritance` cycle prevention (also flagged as PR #20
  NIT by Task 19-a, comment 4899185938). All `pending`.
- **90-2:** `created_by` / `updated_by` UUID columns. · **90-3:** partial
  index on `audit_log WHERE outcome = 'failure'`. Both `pending`.
- **90-4 / P0-6:** Redesign `app_user` to separate login table (no RLS)
  from tenant-scoped profile — required for super_admin login flow in
  Phase 5+. Status: `deferred`.
- **Cross-language canonical JSON contract** (deferred to Phase 8 per
  `docs/conventions/testing.md §3.1a`): PL/pgSQL `jsonb_build_object`
  must match JS canonical form for cross-language hash verification.
- **Cross-cutting security reminder:** operator's GitHub PAT + Neon DB
  password shared in chat — must be rotated.

## Ruleset state at end of phase

- **main-protection (ID 18567129):** strict. `enforcement=active`,
  `bypass_actors=[]`, `pull_request` with
  `required_approving_review_count=1`, `require_code_owner_review=true`,
  `required_review_thread_resolution=true`. Plus `required_linear_history`,
  `deletion`, `non_fast_forward`. **No `required_status_checks` rule yet**
  (added in PR #28 / Task 20-a).
- Relax/restore was used 6 times (PRs #18, #20, #22, #23, #24, #25); each
  time the ruleset was immediately restored and verified with a fresh GET.
