-- packages/db/sql/003_force_rls.sql
--
-- Phase 4.4 — FORCE ROW LEVEL SECURITY
-- Per Roadmap v2.1 §4.4 and ADR-001 point 2 (mandatory configuration).
--
-- JC-18-3: Drizzle 0.40.1 has enableRLS() but NO forceRLS() API. The
-- Drizzle-generated migration (0000_initial.sql) includes
-- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` but NOT
-- `ALTER TABLE ... FORCE ROW LEVEL SECURITY`. This SQL file adds FORCE RLS
-- to every tenant-scoped table.
--
-- WHY FORCE IS MANDATORY (ADR-001 point 2):
--   Without FORCE, the table OWNER bypasses RLS policies. Drizzle migrations
--   run as the table owner (ops_superuser on docker-compose, neondb_owner
--   on Neon staging). If the owner's credentials leak, an attacker can read
--   every tenant's data. FORCE RLS makes the owner subject to policies —
--   unless the owner has BYPASSRLS (ops_superuser does; neondb_owner does).
--   The app connects as app_role (NOBYPASSRLS), so FORCE + BYPASSRLS on
--   ops_superuser is the correct posture: app is always filtered, admin
--   can bypass for cross-tenant operations.
--
-- Apply AFTER the Drizzle migration (0000_initial.sql). Order:
--   1. 001_roles.sql (first init — creates app_role + ops_superuser)
--   2. drizzle-kit migrate (creates tables with ENABLE RLS + policies)
--   3. 003_force_rls.sql (this file — adds FORCE RLS)
--   4. 002_audit_log_immutable.sql (PR D — REVOKE UPDATE/DELETE + hash chain)
--
-- Verification:
--   SELECT relname, relrowsecurity, relforcerowsecurity
--   FROM pg_class
--   WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
--     AND relname IN ('app_user', 'user_role', 'audit_log');
--   -- All three must show: relrowsecurity=t, relforcerowsecurity=t
--
-- The PR E CI test (packages/db/src/__tests__/rls.test.ts) verifies this
-- automatically — it fails if any tenant-scoped table lacks FORCE RLS.

-- app_user (tenant-scoped, nullable tenant_id for super_admin)
ALTER TABLE "app_user" FORCE ROW LEVEL SECURITY;

-- user_role (tenant-scoped join table)
ALTER TABLE "user_role" FORCE ROW LEVEL SECURITY;

-- audit_log (tenant-scoped, append-only)
ALTER TABLE "audit_log" FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- Post-migration GRANTs (belt-and-suspenders)
-- =============================================================================
-- The 001_roles.sql ALTER DEFAULT PRIVILEGES should auto-grant DML to app_role
-- on tables created by ops_superuser. But:
--   1. On Neon staging, migrations run as neondb_owner (not ops_superuser) due
--      to Neon's role privilege restrictions. ALTER DEFAULT PRIVILEGES FOR
--      ops_superuser doesn't apply to tables created by neondb_owner.
--   2. Even on docker-compose, explicit GRANTs are defense-in-depth.
--
-- These GRANTs are idempotent (running them twice is harmless).

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_role;

-- Re-confirm TRUNCATE is revoked (in case a migration re-granted it).
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM app_role;
