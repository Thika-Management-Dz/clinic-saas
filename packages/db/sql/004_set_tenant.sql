-- packages/db/sql/004_set_tenant.sql
--
-- Phase 4.8 — Parameterized set_tenant() SECURITY DEFINER function
-- Per Roadmap v2.1 §4.6 (RLS foundation) and the critical review §3.3 (P0-3).
--
-- This file is NEW in PR2 (Task 20-b, 2026-07-07). It provides the
-- parameterized set_tenant(p_tenant uuid) function that Phase 5's
-- TenantInterceptor MUST use instead of the unsafe() string-interpolation
-- pattern in packages/db/src/__tests__/helpers.ts:withTenant().
--
-- Apply AFTER 002_audit_log_immutable.sql. Order:
--   1. 001_roles.sql (first init — creates roles)
--   2. drizzle-kit migrate (creates tables)
--   3. 003_force_rls.sql (FORCE RLS + grants)
--   4. 002_audit_log_immutable.sql (REVOKE + hash chain trigger)
--   5. 004_set_tenant.sql (this file — parameterized set_tenant function)
--
-- =============================================================================
-- Why this function exists (P0-3 fix)
-- =============================================================================
-- The critical review (docs/audits/2026-07-07-critical-review.md §3.3)
-- flagged the withTenant test helper's `tx.unsafe('SET LOCAL
-- app.current_tenant = ${tenantId}')` as a SQL injection pattern. It's
-- safe today (tests use hardcoded UUIDs), but if Phase 5's
-- TenantInterceptor copies the pattern, any user-controlled value flowing
-- into the tenant context becomes a SQL injection vector.
--
-- `SET LOCAL` does not accept parameters in postgres.js's tagged-template
-- syntax (which is why the test helper used unsafe()). The correct
-- pattern is a SECURITY DEFINER PL/pgSQL function that takes the tenant
-- as a parameter and does the SET LOCAL internally. The function is
-- called via a parameterized query: `SELECT set_tenant($1)`. The
-- parameter is bound by postgres.js, not interpolated, so there's no
-- injection surface.
--
-- Phase 5's TenantInterceptor (NestJS) will call this function at the
-- start of every request transaction:
--
--   await tx`SELECT set_tenant(${tenantId})`;
--
-- Where tenantId is a UUID resolved from the authenticated user's session
-- (NOT from user-controlled request input — the tenant is implicit in the
-- session, not explicit in the request).
--
-- =============================================================================
-- Function definition
-- =============================================================================
-- set_tenant(p_tenant uuid) — sets app.current_tenant for the current
-- transaction. The set_config(..., true) call is the equivalent of
-- SET LOCAL (the `true` is `is_local`, meaning transaction-scoped).
--
-- SECURITY DEFINER is NOT strictly required for this function (it doesn't
-- read any tables — it just calls set_config). But it's declared SECURITY
-- DEFINER for consistency with compute_audit_hash_curr() and to future-
-- proof against adding tenant-existence validation (which WOULD require
-- reading the clinic table — see the optional validation commented out
-- below).
--
-- SET search_path = public prevents search_path injection (same as
-- compute_audit_hash_curr()).

CREATE OR REPLACE FUNCTION set_tenant(p_tenant uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Optional: validate the tenant exists. Uncomment when Phase 5's
    -- TenantInterceptor is ready to enforce tenant existence at the DB
    -- layer (defense in depth — the interceptor should also validate
    -- this at the app layer via the session's tenant_id claim).
    --
    -- IF NOT EXISTS (SELECT 1 FROM clinic WHERE id = p_tenant) THEN
    --     RAISE EXCEPTION 'set_tenant: tenant % does not exist', p_tenant
    --         USING ERRCODE = 'foreign_key_violation';
    -- END IF;

    -- Set app.current_tenant for the current transaction (is_local=true).
    -- The NULLIF(..., '') in the RLS policies (see 0000_initial.sql)
    -- handles the case where this is never called — current_setting
    -- returns NULL, and tenant_id = NULL is false for all rows.
    PERFORM set_config('app.current_tenant', p_tenant::text, true);
END;
$$;

-- =============================================================================
-- Grants
-- =============================================================================
-- app_role needs EXECUTE on set_tenant so the application can call it
-- at the start of each request transaction.
GRANT EXECUTE ON FUNCTION set_tenant(uuid) TO app_role;

-- ops_superuser also gets EXECUTE (for admin operations that need to
-- set a tenant context). ops_superuser has BYPASSRLS so the tenant
-- context doesn't affect its queries, but the function call itself
-- still requires EXECUTE privilege.
GRANT EXECUTE ON FUNCTION set_tenant(uuid) TO ops_superuser;

-- =============================================================================
-- Verification
-- =============================================================================
-- After applying this file, verify the function exists and works:
--
--   -- As app_role:
--   SELECT set_tenant('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
--   SELECT current_setting('app.current_tenant', true);
--   -- Expected: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
--
--   -- Outside a transaction, the setting does NOT persist (is_local=true):
--   -- (Each psql -c is its own transaction, so the setting is gone by
--   -- the next -c.)
--
--   -- Test the parameterized call from postgres.js (Phase 5 pattern):
--   --   await tx`SELECT set_tenant(${tenantId})`;
--   -- This is what the TenantInterceptor will do.
