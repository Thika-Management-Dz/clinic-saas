-- packages/db/sql/002_audit_log_immutable.sql
--
-- Phase 4.5 — Audit Log Immutability + Hash Chain
-- Per Roadmap v2.1 §4.5.1 and Blueprint §9.7.
--
-- This SQL makes audit_log truly append-only:
--   1. REVOKE UPDATE, DELETE FROM app_role (only INSERT allowed).
--   2. Create a PL/pgSQL function compute_audit_hash_curr() that reads the
--      previous row's hash_curr and computes the new row's hash_curr as
--      SHA-256(prev_hash || canonical_json(this_row)).
--   3. Create a BEFORE INSERT trigger that calls the function.
--
-- Apply AFTER the Drizzle migration (0000_initial.sql) and AFTER
-- 003_force_rls.sql. Order:
--   1. 001_roles.sql (first init — creates roles)
--   2. drizzle-kit migrate (creates tables)
--   3. 003_force_rls.sql (FORCE RLS + grants)
--   4. 002_audit_log_immutable.sql (this file — REVOKE + trigger)
--
-- Verification:
--   -- As app_role, attempt UPDATE:
--   UPDATE audit_log SET action='hacked' WHERE id=1;
--   -- Expected: ERROR: permission denied for table audit_log
--
--   -- As app_role, attempt DELETE:
--   DELETE FROM audit_log WHERE id=1;
--   -- Expected: ERROR: permission denied for table audit_log
--
--   -- Hash chain: INSERT row 1, INSERT row 2, verify
--   -- hash_curr of row 2 == SHA-256(hash_curr of row 1 || canonical_json(row 2))
--   -- (tested formally in PR E: packages/db/src/__tests__/audit_log.test.ts)

-- =============================================================================
-- 0. Enable pgcrypto extension (provides digest() for SHA-256)
-- =============================================================================
-- pgcrypto is a standard Postgres extension but isn't enabled by default.
-- digest(data, 'sha256') returns the SHA-256 hash as bytea. We encode it
-- to hex for storage in the hash_curr text column (per JC-18-4).
-- CREATE EXTENSION is idempotent with IF NOT EXISTS.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 1. REVOKE UPDATE, DELETE on audit_log FROM app_role
-- =============================================================================
-- audit_log is append-only. The app can INSERT new audit entries but can
-- NEVER modify or delete existing ones. This is the tamper-evidence
-- guarantee required by Law 18-07 (Algerian data protection) — the audit
-- trail must be immutable for the 6-year retention period.

REVOKE UPDATE, DELETE ON audit_log FROM app_role;

-- Also revoke from PUBLIC (defense in depth — PUBLIC might have privileges
-- via a wider grant we didn't anticipate).
REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC;

-- =============================================================================
-- 2. PL/pgSQL function: compute_audit_hash_curr()
-- =============================================================================
-- Computes hash_curr for a new audit_log row as:
--   SHA-256(prev_hash || canonical_json(this_row))
--
-- Where:
--   prev_hash = hash_curr of the most recent row (by id) before this INSERT,
--               or NULL if this is the first row.
--   canonical_json(this_row) = a deterministic JSON representation of the
--                               row's audit-relevant fields, with keys sorted.
--
-- The function reads NEW (the row being inserted) and sets NEW.hash_prev
-- and NEW.hash_curr. It does NOT return a value (BEFORE INSERT trigger
-- modifies NEW in place).
--
-- Canonical JSON construction:
--   We build the JSON manually with jsonb_build_object (keys are inserted in
--   a deterministic order). jsonb sorts keys alphabetically when serialized,
--   so the output is byte-stable regardless of insertion order. This matches
--   the canonicalJson() pure function in packages/contracts (Phase 8 will
--   add the TS-side test for that function per testing.md §3.1a).
--
-- The hash is stored as hex text (64 chars for SHA-256) per JC-18-4.

CREATE OR REPLACE FUNCTION compute_audit_hash_curr()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    prev_hash TEXT;
    canonical JSONB;
    row_to_hash TEXT;
BEGIN
    -- Read the previous row's hash_curr (the most recent row by id).
    -- If this is the first row, prev_hash is NULL.
    SELECT hash_curr INTO prev_hash
    FROM audit_log
    ORDER BY id DESC
    LIMIT 1;

    -- Set hash_prev on the new row.
    NEW.hash_prev := prev_hash;

    -- Build canonical JSON of the new row's audit-relevant fields.
    -- EXCLUDE hash_prev and hash_curr from the canonical form (they're
    -- derived, not part of the audited content). Including them would
    -- create a circular dependency.
    canonical := jsonb_build_object(
        'timestamp',     to_char(NEW.timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        'tenant_id',     NEW.tenant_id,
        'actor_user_id', NEW.actor_user_id,
        'actor_role',    NEW.actor_role,
        'action',        NEW.action,
        'entity_type',   NEW.entity_type,
        'entity_id',     NEW.entity_id,
        'before_jsonb',  NEW.before_jsonb,
        'after_jsonb',   NEW.after_jsonb,
        'ip_address',    NEW.ip_address::text,
        'user_agent',    NEW.user_agent,
        'request_id',    NEW.request_id,
        'outcome',       NEW.outcome
    );

    -- Compute the hash input: prev_hash || canonical_json.
    -- If prev_hash is NULL (first row), the input is just canonical_json.
    row_to_hash := COALESCE(prev_hash, '') || canonical::text;

    -- Compute SHA-256 and store as hex.
    NEW.hash_curr := encode(digest(row_to_hash, 'sha256'), 'hex');

    RETURN NEW;
END;
$$;

-- =============================================================================
-- 3. BEFORE INSERT trigger on audit_log
-- =============================================================================
-- Fires compute_audit_hash_curr() before every INSERT on audit_log.
-- The trigger is SECURITY DEFINER (via the function) so it can read the
-- previous row even if the inserting role (app_role) couldn't otherwise
-- see other rows (RLS would normally restrict this — but we need to read
-- the MAX(id) row's hash_curr regardless of tenant to maintain the chain).
--
-- SECURITY IMPLICATION: the function reads across tenants (MAX(id) is
-- global). This is necessary for the hash chain to be sequential. The
-- function only reads hash_curr (a hash, not PII) — no patient data is
-- exposed. The function is SECURITY DEFINER + SET search_path = public
-- to prevent search_path injection.

DROP TRIGGER IF EXISTS audit_log_hash_chain ON audit_log;
CREATE TRIGGER audit_log_hash_chain
    BEFORE INSERT ON audit_log
    FOR EACH ROW
    EXECUTE FUNCTION compute_audit_hash_curr();

-- =============================================================================
-- 4. Verification queries (run manually after this script)
-- =============================================================================
-- These are NOT executed by this script; they are documented for the
-- operator and run formally in PR E (audit_log.test.ts).
--
--   -- Verify UPDATE is denied:
--   SET ROLE app_role;
--   UPDATE audit_log SET action='hacked' WHERE id=1;
--   -- Expected: ERROR: permission denied for table audit_log
--
--   -- Verify DELETE is denied:
--   DELETE FROM audit_log WHERE id=1;
--   -- Expected: ERROR: permission denied for table audit_log
--
--   -- Verify hash chain (requires a row to exist):
--   SELECT id, hash_prev, hash_curr FROM audit_log ORDER BY id LIMIT 5;
--   -- hash_prev of row N should equal hash_curr of row N-1.
--   -- hash_curr of row N should equal SHA-256(hash_curr of row N-1 || canonical_json(row N)).
