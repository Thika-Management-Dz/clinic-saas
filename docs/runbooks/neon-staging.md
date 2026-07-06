# Neon Staging Setup

> **Phase 4.7 — Neon Free for Staging**
> Per Roadmap v2.1 §4.7. This doc is for the operator — the AI agent
> cannot perform these steps (requires the operator's Neon account + Doppler tokens).

## What this is

The staging database is a Neon free-tier Postgres 17 instance in `eu-central-1` (Frankfurt) — the closest Neon region to Algeria with reasonable latency. It hosts the staging schema (same as local dev, applied via Drizzle migrations) for integration testing, staging deploys, and demo environments.

**Production will NOT use Neon** — production must be Algerian sovereign infrastructure (CERIST Cloud or Djezzy Cloud VPS per Blueprint §6). Neon is staging-only.

## What the agent already did (Phase 4, this session)

The agent set up the Neon staging DB during Phase 4 verification. Here's what was done:

1. **Neon project created**: `clinic-saas` (owner: operator), region `eu-central-1` (Frankfurt), Postgres 17.
2. **Roles bootstrapped** (as `neondb_owner`):
   - `ops_superuser` with `BYPASSRLS` — reserved admin role. Strong generated password.
   - `app_role` with `NOBYPASSRLS` — the application's DB role. Strong generated password.
   - Neon rejected the weak dev defaults (`dev_password`, `dev_ops_password`) — its password policy requires mixed case + numbers + length. Strong passwords were generated.
3. **Migration applied** (as `neondb_owner` — see JC-18-5): all 8 Phase 4 tables created with ENABLE RLS + policies.
4. **FORCE RLS applied**: `003_force_rls.sql` — all 3 tenant-scoped tables have FORCE RLS.
5. **Audit immutability applied**: `002_audit_log_immutable.sql` — pgcrypto extension, REVOKE UPDATE/DELETE, hash-chain trigger.
6. **Seed applied**: 2 clinics, 9 roles, 8 inheritance edges, 3 test users.
7. **19 Vitest tests pass** against this Neon DB (RLS + audit immutability + hash chain).

## What the operator must do (PR F scope)

### 1. Store credentials in Doppler

The agent generated strong passwords for `ops_superuser` and `app_role` on Neon. These are in `/tmp/.env.neon` (session-only — the agent did NOT commit them). The operator must:

```bash
# Get the passwords from the agent's session (or regenerate via Neon dashboard)
# Then store in Doppler:
doppler secrets set --project clinic-saas --config stg \
  DATABASE_URL="postgresql://app_role:<app_role_pw>@ep-holy-glade-asqt1jwl.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require" \
  MIGRATION_DATABASE_URL="postgresql://ops_superuser:<ops_superuser_pw>@ep-holy-glade-asqt1jwl.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require" \
  DIRECT_URL_STAGING="postgresql://neondb_owner:<neon_owner_pw>@ep-holy-glade-asqt1jwl.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require"
```

- `DATABASE_URL` — the app connection (`app_role`, NOBYPASSRLS). Used by apps/api, apps/worker, apps/web at runtime in staging.
- `MIGRATION_DATABASE_URL` — the migration connection (`neondb_owner` on Neon, BYPASSRLS). Used by `pnpm db:migrate` in CI/deploy.
- `DIRECT_URL_STAGING` — the Neon owner connection (`neondb_owner`). Used for admin operations (creating/dropping roles, extension management).

### 2. Rotate the Neon DB password

The Neon connection string (including `neondb_owner` password) was shared in chat during this session. **Rotate it now:**

1. Go to the Neon dashboard → `clinic-saas` project → Roles.
2. For each role (`neondb_owner`, `ops_superuser`, `app_role`): reset the password.
3. Update Doppler secrets with the new passwords.
4. Re-run the bootstrap script (the roles SQL is idempotent — it will update passwords without breaking existing data):
   ```bash
   # As neondb_owner (new password), re-run:
   psql "$DIRECT_URL_STAGING" -f packages/db/sql/001_roles.sql
   # (Note: 001_roles.sql hardcodes 'dev_ops_password' / 'dev_password' —
   # for Neon, use the neon-bootstrap.mjs approach or edit the SQL with
   # the strong passwords before running.)
   ```

### 3. Verify staging parity

After storing credentials in Doppler, verify the staging DB matches local dev:

```bash
# Apply any future migrations to staging:
doppler run --project clinic-saas --config stg -- \
  pnpm --filter @clinic-saas/db db:migrate

# Run the test suite against staging:
doppler run --project clinic-saas --config stg -- \
  pnpm --filter @clinic-saas/db test

# Open Drizzle Studio against staging:
doppler run --project clinic-saas --config stg -- \
  pnpm --filter @clinic-saas/db db:studio
```

All 19 tests should pass (same as local dev).

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

## Resetting the staging DB

If the staging DB needs a full reset (e.g., before a Phase 5 demo):

```bash
# Drop all tables (as neondb_owner):
doppler run --project clinic-saas --config stg -- \
  psql "$MIGRATION_DATABASE_URL" -c "
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT USAGE ON SCHEMA public TO app_role;
    GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_role;
  "

# Re-apply migration + FORCE RLS + audit immutability + seed:
doppler run --project clinic-saas --config stg -- \
  bash -c '
    pnpm --filter @clinic-saas/db db:migrate &&
    psql "$MIGRATION_DATABASE_URL" -f packages/db/sql/003_force_rls.sql &&
    psql "$MIGRATION_DATABASE_URL" -f packages/db/sql/002_audit_log_immutable.sql &&
    pnpm --filter @clinic-saas/db db:seed
  '
```

## Production is NOT Neon

Per Blueprint §3 (Data Residency) and Law 18-07: patient-identifiable health data must reside in Algeria. Neon (Frankfurt) is acceptable for **staging** (no real patient data) but **NOT for production**. Production uses CERIST Cloud or Djezzy Cloud VPS (Algerian sovereign infrastructure), configured in Phase 16.
