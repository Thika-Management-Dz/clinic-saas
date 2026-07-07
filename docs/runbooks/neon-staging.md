# Neon Staging Setup

> **Phase 4.7 — Neon Free for Staging**
> Per Roadmap v2.1 §4.7. The agent can perform most of this setup during a
> session (using credentials shared in chat — see ADR-011 Tier 1); the only
> steps that require the operator are creating the Neon project and rotating
> the Neon owner password if it leaks.

## What this is

The staging database is a Neon free-tier Postgres 17 instance in `eu-central-1` (Frankfurt) — the closest Neon region to Algeria with reasonable latency. It hosts the staging schema (same as local dev, applied via Drizzle migrations) for integration testing, staging deploys, and demo environments.

**Production will NOT use Neon** — production must be Algerian sovereign infrastructure (CERIST Cloud or Djezzy Cloud VPS per Blueprint §6). Neon is staging-only.

## Secrets-management posture (per ADR-011)

Staging secrets are stored in a **gitignored `.env.staging` file** at the repo root — **not** in Doppler. Doppler Service Tokens (the headless workflow the original Phase 4 plan assumed) require the Doppler Team plan (~$99/mo), and the project is on the free Developer plan. The operator has decided (ADR-011, 2026-07-07) to defer the Doppler decision until post-revenue, and to use:

- **Tier 1 (now):** gitignored `.env.staging` for local dev + staging.
- **Tier 2 (Phase 7):** GitHub Actions encrypted secrets for CI.
- **Tier 3 (Phase 16):** on-host `.env` + systemd `LoadCredential` for production.

See [`docs/adr/ADR-011.md`](../adr/ADR-011.md) for the full decision and alternatives-considered table.

## What the agent already did (Phase 4 + Task 19-b)

The agent set up the Neon staging DB during Phase 4 and verified it at runtime in Task 19-b. Here's what was done:

1. **Neon project created** (by the operator): `clinic-saas`, region `eu-central-1` (Frankfurt), Postgres 17.
2. **Roles bootstrapped** (as `neondb_owner`):
   - `ops_superuser` with `BYPASSRLS` — reserved admin role. Strong generated password.
   - `app_role` with `NOBYPASSRLS` — the application's DB role. Strong generated password.
   - Neon rejected the weak dev defaults (`dev_password`, `dev_ops_password`) — its password policy requires mixed case + numbers + length. Strong passwords were generated via `openssl rand -base64 24`.
3. **Migration applied** (as `neondb_owner` — see JC-18-5): all 8 Phase 4 tables created with ENABLE RLS + policies.
4. **FORCE RLS applied**: `003_force_rls.sql` — all 3 tenant-scoped tables have FORCE RLS.
5. **Audit immutability applied**: `002_audit_log_immutable.sql` — pgcrypto extension, REVOKE UPDATE/DELETE, hash-chain trigger.
6. **Seed applied**: 2 clinics, 9 roles, 8 inheritance edges, 3 test users.
7. **19 Vitest tests pass** against this Neon DB (RLS + audit immutability + hash chain).
8. **Task 19-b runtime verification** (2026-07-07): re-verified all RLS guarantees at runtime — `app_role.rolbypassrls=false`, `relrowsecurity=t` + `relforcerowsecurity=t` on all 3 tenant-scoped tables, no TRUNCATE on any table, hash chain smoke test (2 rows, link verified), 19/19 tests pass with env loaded from `.env.staging`.

## What the operator must do (one-time setup)

### 1. Populate `.env.staging` from the template

```bash
cp .env.staging.example .env.staging
chmod 600 .env.staging
$EDITOR .env.staging   # fill in the real app_role + neondb_owner passwords
```

The agent's session-only artifact at `/tmp/.env.neon` (chmod 600, NOT committed) holds the current values during a session. The operator can copy the values from there into `.env.staging`, or regenerate them on the Neon dashboard.

If you are an AI-agent sandbox continuing this work: the previous session's `/tmp/.env.neon` is gone. Re-bootstrap the role passwords (see "Resetting the staging DB" below for the SQL) and write a fresh `/tmp/.env.neon`, then copy to `.env.staging`.

### 2. Verify staging parity

After populating `.env.staging`, verify the staging DB matches local dev:

```bash
# Load .env.staging into the shell, then run the test suite against staging:
set -a && . ./.env.staging && set +a
pnpm --filter @clinic-saas/db test

# Apply any future migrations to staging:
pnpm --filter @clinic-saas/db db:migrate

# Open Drizzle Studio against staging:
pnpm --filter @clinic-saas/db db:studio
```

All 19 tests should pass (same as local dev).

### 3. Set up CI secrets (deferred to Phase 7)

When CI lands in Phase 7, the same three values (`DATABASE_URL`, `MIGRATION_DATABASE_URL`, `DIRECT_URL_STAGING`) go into **GitHub Actions encrypted repository secrets** at:

```
https://github.com/Thika-Management-Dz/clinic-saas/settings/secrets/actions
```

This is documented in `docs/runbooks/ci-secrets.md` (to be written in Phase 7). Per ADR-011 Tier 2, GitHub Actions secrets are free, scoped to the repo, masked in logs, and accessible to workflows via the `secrets.*` context — no `doppler run` wrapper required.

### 4. Rotate the Neon DB password if it leaks

The Neon `neondb_owner` password is shared in chat history during AI-agent sessions. Per the operator's authority (see the "OPERATOR AUTHORITY" section of the session prompt that produced this doc), this is accepted risk and **does not require rotation** unless the operator explicitly requests it. If a rotation is requested:

1. Go to the Neon dashboard → `clinic-saas` project → Roles → `neondb_owner` → Reset password.
2. Update `.env.staging` with the new password (lines for `MIGRATION_DATABASE_URL` and `DIRECT_URL_STAGING`).
3. Re-run `pnpm --filter @clinic-saas/db test` to confirm the new password works.
4. (Phase 7 onward) Update the GitHub Actions secrets as well — see `docs/runbooks/ci-secrets.md`.

The `app_role` and `ops_superuser` passwords are generated per-session by the AI agent (via `openssl rand -base64 24`) and stored only in `.env.staging` + the agent's session-only `/tmp/.env.neon`. They are NOT shared in chat. To rotate them, just re-run the bootstrap SQL (idempotent — see "Resetting the staging DB" below).

## JC-18-5: Neon runs migrations as `neondb_owner`, not `ops_superuser`

On docker-compose (local dev), the migration runs as `ops_superuser` (per `MIGRATION_DATABASE_URL` in `.env.local`). On Neon, `ops_superuser` cannot `CREATE TABLE` because Neon restricts role privileges — `neondb_owner` is the only role with schema CREATE privileges, and `neondb_owner` cannot `GRANT` itself to `ops_superuser` (needs ADMIN option, which Neon doesn't provide).

**Adaptation**: on Neon, `MIGRATION_DATABASE_URL` is set to the `neondb_owner` connection string. Tables are owned by `neondb_owner`. This is equivalent for RLS purposes because:
- `neondb_owner` has `BYPASSRLS` (same as `ops_superuser`).
- `FORCE ROW LEVEL SECURITY` applies to the owner regardless of which role that is.
- The app connects as `app_role` (NOBYPASSRLS) in both environments — RLS enforcement on the app is identical.

The `003_force_rls.sql` includes explicit `GRANT SELECT, INSERT, UPDATE ON ALL TABLES TO app_role` as belt-and-suspenders (the `ALTER DEFAULT PRIVILEGES FOR ops_superuser` from `001_roles.sql` doesn't apply to tables created by `neondb_owner`).

## Connection string reference

| Variable | Role | BYPASSRLS | Used by |
|----------|------|-----------|---------|
| `DATABASE_URL` | `app_role` | NO | apps/api, apps/worker, apps/web at runtime |
| `MIGRATION_DATABASE_URL` | `neondb_owner` (Neon) / `ops_superuser` (docker-compose) | YES | `pnpm db:migrate`, `pnpm db:seed` |
| `DIRECT_URL_STAGING` | `neondb_owner` | YES | admin operations (role management, extensions) |

> **Note (NIT fix from PR #25 review):** the example `MIGRATION_DATABASE_URL` on this line previously showed `ops_superuser` as the role for Neon staging. That was wrong — per JC-18-5, Neon staging uses `neondb_owner` for migrations. Fixed in Task 19-b.

## Resetting the staging DB

If the staging DB needs a full reset (e.g., before a Phase 5 demo), or if you need to re-bootstrap `ops_superuser` + `app_role` with fresh passwords:

```bash
# Load .env.staging into the shell:
set -a && . ./.env.staging && set +a

# Option A: full reset (drop schema + re-apply everything)
psql "$MIGRATION_DATABASE_URL" -c "
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  GRANT USAGE ON SCHEMA public TO app_role;
  GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_role;
"
pnpm --filter @clinic-saas/db db:migrate
psql "$MIGRATION_DATABASE_URL" -f packages/db/sql/003_force_rls.sql
psql "$MIGRATION_DATABASE_URL" -f packages/db/sql/002_audit_log_immutable.sql
pnpm --filter @clinic-saas/db db:seed

# Option B: just re-bootstrap role passwords (idempotent — does not touch data)
# Generate strong passwords:
NEW_OPS_PW=$(openssl rand -base64 24)
NEW_APP_PW=$(openssl rand -base64 24)
psql "$MIGRATION_DATABASE_URL" -c "ALTER ROLE ops_superuser WITH LOGIN PASSWORD '$NEW_OPS_PW' BYPASSRLS;"
psql "$MIGRATION_DATABASE_URL" -c "ALTER ROLE app_role    WITH LOGIN PASSWORD '$NEW_APP_PW' NOBYPASSRLS;"
# Then update .env.staging with the new DATABASE_URL (app_role + new password).
# MIGRATION_DATABASE_URL + DIRECT_URL_STAGING stay the same (neondb_owner unchanged).
```

## Production is NOT Neon

Per Blueprint §3 (Data Residency) and Law 18-07: patient-identifiable health data must reside in Algeria. Neon (Frankfurt) is acceptable for **staging** (no real patient data) but **NOT for production**. Production uses CERIST Cloud or Djezzy Cloud VPS (Algerian sovereign infrastructure), configured in Phase 16 per ADR-011 Tier 3.
