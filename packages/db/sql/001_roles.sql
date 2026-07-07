-- packages/db/sql/001_roles.sql
--
-- Phase 4.2 — Postgres Roles (RLS Foundation)
-- Per Roadmap v2.1 §4.2 and ADR-001 (Pool-Model Multi-Tenancy with RLS).
--
-- This script runs automatically on first Postgres container init via
-- docker-entrypoint-initdb.d/ (mounted in docker-compose.yml). It runs
-- as the POSTGRES_USER (postgres superuser), so it can create roles and
-- grant privileges.
--
-- To re-run manually on an existing volume (docker-compose):
--   docker compose exec postgres \
--     psql -U postgres -d clinic_dev \
--     -v app_role_password="$APP_ROLE_PASSWORD" \
--     -v ops_password="$OPS_PASSWORD" \
--     -f /sql/001_roles.sql
--
-- To re-run from the host (no docker):
--   PGPASSWORD=dev_postgres_password psql \
--     -h localhost -U postgres -d clinic_dev \
--     -v app_role_password='dev_password' \
--     -v ops_password='dev_ops_password' \
--     -f packages/db/sql/001_roles.sql
--
-- CRITICAL RLS GUARANTEE (ADR-001 §mandatory configuration point 4):
--   app_role has NOBYPASSRLS. Only ops_superuser has BYPASSRLS.
--   The application NEVER connects as ops_superuser.
--   Verify after first init:
--     psql postgresql://postgres:$POSTGRES_PASSWORD@localhost:5432/clinic_dev \
--       -c '\du app_role'
--   The attributes column must NOT list BYPASSRLS.
--   If it does, RLS is broken and every tenant's data is readable by the app.

-- =============================================================================
-- 1. Create the two DB roles
-- =============================================================================

-- ops_superuser: reserved admin role with BYPASSRLS. Used for:
--   - running Drizzle migrations (CREATE TABLE, CREATE POLICY, etc.)
--   - cross-tenant admin operations (with audit-log entries per §9.7)
--   - backup/restore (pgBackRest connects as this role)
-- The app NEVER connects as this role. Migrations run as this role so
-- the tables are owned by ops_superuser; with FORCE ROW LEVEL SECURITY,
-- the owner is subject to RLS policies, but BYPASSRLS lets ops_superuser
-- ignore them for admin operations.
CREATE ROLE ops_superuser WITH LOGIN PASSWORD :'ops_password' BYPASSRLS;

-- app_role: the application's DB role. NOBYPASSRLS is MANDATORY — RLS
-- policies are enforced for every query the app issues. The app connects
-- as app_role via DATABASE_URL. Tenant isolation depends on this single
-- attribute.
CREATE ROLE app_role WITH LOGIN PASSWORD :'app_role_password' NOBYPASSRLS;

-- =============================================================================
-- 2. Grant app_role access to the database and schema
-- =============================================================================

-- app_role can connect to the clinic_dev database and use the public schema.
GRANT CONNECT ON DATABASE clinic_dev TO app_role;
GRANT USAGE ON SCHEMA public TO app_role;

-- ops_superuser needs CREATE on schema public AND on the database to run
-- drizzle migrations. Two reasons:
--
--   1. drizzle-kit migrate (v0.30+) runs `CREATE SCHEMA IF NOT EXISTS
--      "drizzle"` for its __drizzle_migrations bookkeeping table. CREATE
--      SCHEMA requires CREATE on the DATABASE (not just on a schema).
--      Without this, drizzle-kit fails with
--      "permission denied for database clinic_dev".
--
--   2. The migration SQL itself (packages/db/migrations/0000_initial.sql)
--      runs `CREATE TABLE ... IN public`, `CREATE INDEX ...`, `CREATE
--      POLICY ...`. Postgres 15+ revoked the default
--      CREATE-on-public-to-PUBLIC grant, so without an explicit
--      `GRANT CREATE ON SCHEMA public`, ops_superuser cannot create
--      tables in the public schema.
--
-- Both grants are required. The bug was never caught before because the
-- operator always ran tests against Neon staging (where neondb_owner, the
-- DB owner, runs migrations per JC-18-5 — and the DB owner has CREATE on
-- both the database and the public schema by default). Local docker-
-- compose dev with a fresh volume was silently broken; CI exposed it.
--
-- On Neon staging these GRANTs are no-ops (neondb_owner already has these
-- privileges as the DB owner, and the GRANTs are idempotent).
--
-- This is also a prerequisite for the ALTER DEFAULT PRIVILEGES FOR
-- ROLE ops_superuser statements in §4 below (those default privileges only
-- apply to objects created BY ops_superuser, which requires ops_superuser
-- to be able to create objects in the first place).
--
-- Previously tracked as P0-2 / 30-3. Resolved: this file now uses psql
-- :var substitution for passwords (no plaintext credentials).
GRANT CREATE ON DATABASE clinic_dev TO ops_superuser;
GRANT USAGE, CREATE ON SCHEMA public TO ops_superuser;

-- =============================================================================
-- 3. Grant DML privileges on existing tables
-- =============================================================================
-- At first init, no tables exist yet (the migration runs later in Phase 4.4).
-- These GRANTs cover any tables that already exist. Future tables are covered
-- by ALTER DEFAULT PRIVILEGES below.
--
-- Note: only SELECT, INSERT, UPDATE are granted — NOT DELETE, TRUNCATE, or
-- REFERENCES. Soft deletes use UPDATE on deleted_at; hard DELETE is forbidden
-- per AGENTS.md Do-NOT #1. TRUNCATE bypasses RLS (ADR-001 point 6) and is
-- revoked explicitly in §5 below.

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_role;

-- =============================================================================
-- 4. ALTER DEFAULT PRIVILEGES — auto-grant on future tables
-- =============================================================================
-- Tables created by ops_superuser (i.e., by Drizzle migrations) will
-- automatically grant SELECT, INSERT, UPDATE to app_role. This ensures
-- new tables added in future migrations are accessible to the app without
-- manual GRANT statements in every migration file.
--
-- FOR ROLE ops_superuser: the default privileges apply to objects created
-- BY ops_superuser. This script runs as postgres (superuser), so it can
-- set defaults for ops_superuser.

ALTER DEFAULT PRIVILEGES FOR ROLE ops_superuser IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO app_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ops_superuser IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_role;

-- =============================================================================
-- 5. REVOKE TRUNCATE — defense in depth (ADR-001 point 6)
-- =============================================================================
-- RLS does NOT apply to TRUNCATE. If app_role had TRUNCATE privilege, a
-- buggy app could TRUNCATE a tenant's data, bypassing RLS entirely.
-- We did not grant TRUNCATE above (SELECT/INSERT/UPDATE only), so app_role
-- does not have it. This explicit REVOKE is belt-and-suspenders for any
-- tables where TRUNCATE might have been granted by a wider GRANT.

REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM app_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ops_superuser IN SCHEMA public
  REVOKE TRUNCATE ON TABLES FROM app_role;

-- =============================================================================
-- 6. Verification queries (run manually after this script)
-- =============================================================================
-- These are NOT executed by this script; they are documented here for the
-- operator to run after first init. See PR A description for expected output.
--
--   -- Confirm app_role does NOT have BYPASSRLS:
--   \du app_role
--   -- Expected: attributes column lists nothing (or just "Cannot login" if
--   -- LOGIN was not set — but we set LOGIN above, so it should be empty).
--   -- MUST NOT contain "BypassRLs".
--
--   -- Confirm ops_superuser HAS BYPASSRLS:
--   \du ops_superuser
--   -- Expected: attributes column contains "BypassRLS".
