// packages/db/src/__tests__/audit_log.test.ts
//
// Phase 4.6 — Audit log immutability + hash chain tests.
// Per Roadmap v2.1 §4.6.2 and Blueprint §9.7.
//
// Tests:
//   1. app_role INSERT audit_log succeeds (append-only allows INSERT).
//   2. app_role UPDATE audit_log is DENIED (permission denied).
//   3. app_role DELETE audit_log is DENIED (permission denied).
//   4. Hash chain: first row has hash_prev = NULL.
//   5. Hash chain: row N's hash_prev == row N-1's hash_curr.
//   6. Hash chain integrity: recomputing SHA-256(prev || canonical_json(row))
//      matches the stored hash_curr.

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
// Test files deal with dynamic postgres.js return types where strict type
// safety is impractical. The DB queries themselves are type-checked at
// runtime by postgres.js; the test assertions use vitest's expect() which
// accepts any.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import {
  connectAsApp,
  connectAsOwner,
  withTenant,
  ensureTestClinic,
  cleanupTestData,
  TEST_TENANT_A,
  TEST_TENANT_B,
} from './helpers';

const ownerSql = connectAsOwner();
const appSql = connectAsApp();

beforeAll(async () => {
  await ensureTestClinic(ownerSql, TEST_TENANT_A, 'Audit Test Clinic A');
});

afterAll(async () => {
  await cleanupTestData(ownerSql);
  await appSql.end();
  await ownerSql.end();
});

// Clean up audit_log rows between tests
beforeEach(async () => {
  await ownerSql`DELETE FROM audit_log WHERE tenant_id = ${TEST_TENANT_A}`;
});

describe('audit_log immutability', () => {
  it('app_role can INSERT into audit_log (append-only allows INSERT)', async () => {
    const rows = await withTenant(appSql, TEST_TENANT_A, async (tx) => {
      return await tx`
        INSERT INTO audit_log (tenant_id, actor_role, action, entity_type, entity_id, outcome)
        VALUES (${TEST_TENANT_A}, 'clinic_admin', 'test.insert', 'test_entity', 'audit-1', 'success')
        RETURNING id
      `;
    });
    expect(rows.length).toBe(1);
    const r = rows[0];
    if (!r) throw new Error('row not found');
    expect(r.id).toBeDefined();
  });

  it('app_role UPDATE on audit_log is DENIED', async () => {
    // First insert a row
    const inserted = await withTenant(appSql, TEST_TENANT_A, async (tx) => {
      return await tx`
        INSERT INTO audit_log (tenant_id, actor_role, action, entity_type, entity_id, outcome)
        VALUES (${TEST_TENANT_A}, 'clinic_admin', 'test.update_target', 'test_entity', 'audit-2', 'success')
        RETURNING id
      `;
    });
    const ins = inserted[0];
    if (!ins) throw new Error('insert failed');
    const rowId = ins.id;

    // Attempt UPDATE — should be denied
    await expect(
      withTenant(appSql, TEST_TENANT_A, async (tx) => {
        await tx`UPDATE audit_log SET action = 'hacked' WHERE id = ${rowId}`;
      }),
    ).rejects.toThrow(/permission denied for table audit_log/);
  });

  it('app_role DELETE on audit_log is DENIED', async () => {
    const inserted = await withTenant(appSql, TEST_TENANT_A, async (tx) => {
      return await tx`
        INSERT INTO audit_log (tenant_id, actor_role, action, entity_type, entity_id, outcome)
        VALUES (${TEST_TENANT_A}, 'clinic_admin', 'test.delete_target', 'test_entity', 'audit-3', 'success')
        RETURNING id
      `;
    });
    const ins = inserted[0];
    if (!ins) throw new Error('insert failed');
    const rowId = ins.id;

    await expect(
      withTenant(appSql, TEST_TENANT_A, async (tx) => {
        await tx`DELETE FROM audit_log WHERE id = ${rowId}`;
      }),
    ).rejects.toThrow(/permission denied for table audit_log/);
  });
});

describe('audit_log hash chain', () => {
  it('first row has hash_prev = NULL', async () => {
    // Ensure no prior rows for this tenant (beforeAll already cleaned)
    const rows = await withTenant(appSql, TEST_TENANT_A, async (tx) => {
      return await tx`
        INSERT INTO audit_log (tenant_id, actor_role, action, entity_type, entity_id, outcome)
        VALUES (${TEST_TENANT_A}, 'clinic_admin', 'test.first', 'test_entity', 'audit-first', 'success')
        RETURNING id, hash_prev, hash_curr
      `;
    });
    const r0 = rows[0];
    if (!r0) throw new Error('first row not found');
    expect(r0.hash_prev).toBeNull();
    expect(r0.hash_curr).toBeTruthy();
    expect(r0.hash_curr.length).toBe(64); // SHA-256 hex
  });

  it('row N hash_prev == row N-1 hash_curr (chain links)', async () => {
    const row1 = await withTenant(appSql, TEST_TENANT_A, async (tx) => {
      return await tx`
        INSERT INTO audit_log (tenant_id, actor_role, action, entity_type, entity_id, outcome)
        VALUES (${TEST_TENANT_A}, 'clinic_admin', 'test.chain1', 'test_entity', 'chain-1', 'success')
        RETURNING id, hash_curr
      `;
    });
    const row2 = await withTenant(appSql, TEST_TENANT_A, async (tx) => {
      return await tx`
        INSERT INTO audit_log (tenant_id, actor_role, action, entity_type, entity_id, outcome)
        VALUES (${TEST_TENANT_A}, 'physician', 'test.chain2', 'test_entity', 'chain-2', 'success')
        RETURNING id, hash_prev, hash_curr
      `;
    });
    const r1 = row1[0];
    const r2 = row2[0];
    if (!r1 || !r2) throw new Error('chain rows not found');
    expect(r2.hash_prev).toBe(r1.hash_curr);
  });

  it('hash_curr matches recomputed SHA-256(prev_hash || canonical_json) — recomputed in Postgres', async () => {
    // Insert a row, then recompute its hash_curr IN POSTGRES using the same
    // canonical JSON construction the trigger function uses. This verifies:
    //   1. The trigger fired (hash_curr is non-null).
    //   2. The hash is deterministic (same inputs → same hash).
    //   3. The hash chain links (prev_hash is used correctly).
    //
    // We recompute in Postgres (not JS) because the PL/pgSQL function uses
    // `to_char(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`
    // which has microsecond precision. JS Date only has millisecond precision,
    // so a JS recompute can't byte-match the canonical JSON.
    //
    // The cross-language contract (JS canonicalJson() == PL/pgSQL jsonb) is
    // tested in Phase 8 when packages/contracts/src/audit/canonical-json.ts
    // lands (per testing.md §3.1a). For Phase 4, we verify the hash chain is
    // internally consistent by recomputing in Postgres.
    const inserted = await withTenant(appSql, TEST_TENANT_A, async (tx) => {
      return await tx`
        INSERT INTO audit_log (tenant_id, actor_role, action, entity_type, entity_id, outcome)
        VALUES (${TEST_TENANT_A}, 'nurse', 'test.recompute', 'test_entity', 'recompute-1', 'success')
        RETURNING id, hash_curr
      `;
    });
    const row = inserted[0];
    if (!row) throw new Error('inserted row not found');

    // Recompute the hash in Postgres using the same logic as the trigger function.
    // Uses a LEFT JOIN to prev so the query still returns a row even when this
    // is the first row in the table (prev.hash_curr will be NULL → COALESCE to '').
    //
    // PR2 / Task 20-b: the prev_hash lookup is now PER-TENANT
    // (WHERE tenant_id = a.tenant_id AND id < a.id), matching the redesigned
    // compute_audit_hash_curr() function. The OLD global lookup
    // (WHERE id < a.id with no tenant filter) is no longer correct.
    const recomputed = await ownerSql`
      SELECT
        a.hash_curr as stored_hash,
        encode(
          digest(
            COALESCE(p.hash_curr, '') ||
            jsonb_build_object(
              'timestamp',     to_char(a.timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
              'tenant_id',     a.tenant_id,
              'actor_user_id', a.actor_user_id,
              'actor_role',    a.actor_role,
              'action',        a.action,
              'entity_type',   a.entity_type,
              'entity_id',     a.entity_id,
              'before_jsonb',  a.before_jsonb,
              'after_jsonb',   a.after_jsonb,
              'ip_address',    a.ip_address::text,
              'user_agent',    a.user_agent,
              'request_id',    a.request_id,
              'outcome',       a.outcome
            )::text,
            'sha256'
          ),
          'hex'
        ) as expected_hash
      FROM audit_log a
      LEFT JOIN LATERAL (
        SELECT hash_curr FROM audit_log
        WHERE tenant_id = a.tenant_id AND id < a.id
        ORDER BY id DESC LIMIT 1
      ) p ON true
      WHERE a.id = ${row.id}
    `;
    const r = recomputed[0];
    if (!r) throw new Error('recompute query returned no rows');
    expect(r.stored_hash).toBe(r.expected_hash);
  });

  // =============================================================================
  // PR2 / Task 20-b — new tests for the per-tenant + advisory lock redesign.
  // These test P0-4 (race condition) and P0-5 (cross-tenant coupling) fixes.
  // =============================================================================

  it('per-tenant chain independence: tenant B rows do not affect tenant A chain (P0-5 fix)', async () => {
    // Insert rows for tenant A, then B, then A. Verify tenant A's 3rd row's
    // hash_prev == tenant A's 2nd row's hash_curr — NOT tenant B's.
    // (With the OLD global-chain logic, tenant A's 3rd row's hash_prev would
    // be tenant B's only row's hash_curr — that's the P0-5 bug.)
    await ensureTestClinic(ownerSql, TEST_TENANT_B, 'Audit Test Clinic B (P0-5)');

    // Tenant A, row 1
    const a1 = await withTenant(appSql, TEST_TENANT_A, async (tx) => {
      return await tx`
        INSERT INTO audit_log (tenant_id, actor_role, action, entity_type, entity_id, outcome)
        VALUES (${TEST_TENANT_A}, 'clinic_admin', 'test.p0_5_a1', 'test_entity', 'a1', 'success')
        RETURNING id, hash_curr
      `;
    });
    // Tenant B, row 1 (interleaved)
    const b1 = await withTenant(appSql, TEST_TENANT_B, async (tx) => {
      return await tx`
        INSERT INTO audit_log (tenant_id, actor_role, action, entity_type, entity_id, outcome)
        VALUES (${TEST_TENANT_B}, 'clinic_admin', 'test.p0_5_b1', 'test_entity', 'b1', 'success')
        RETURNING id, hash_curr
      `;
    });
    // Tenant A, row 2 — its hash_prev should be a1.hash_curr, NOT b1.hash_curr
    const a2 = await withTenant(appSql, TEST_TENANT_A, async (tx) => {
      return await tx`
        INSERT INTO audit_log (tenant_id, actor_role, action, entity_type, entity_id, outcome)
        VALUES (${TEST_TENANT_A}, 'clinic_admin', 'test.p0_5_a2', 'test_entity', 'a2', 'success')
        RETURNING id, hash_prev, hash_curr
      `;
    });

    const r_a1 = a1[0];
    const r_b1 = b1[0];
    const r_a2 = a2[0];
    if (!r_a1 || !r_b1 || !r_a2) throw new Error('rows not found');

    // The P0-5 fix: a2.hash_prev == a1.hash_curr (per-tenant chain).
    expect(r_a2.hash_prev).toBe(r_a1.hash_curr);
    // And NOT b1.hash_curr (which would be the OLD global-chain behavior).
    expect(r_a2.hash_prev).not.toBe(r_b1.hash_curr);
    // Sanity: a1 and a2 hashes are different (different content).
    expect(r_a2.hash_curr).not.toBe(r_a1.hash_curr);

    // Cleanup tenant B's test clinic + audit rows for tenant B.
    await ownerSql`DELETE FROM audit_log WHERE tenant_id = ${TEST_TENANT_B}`;
    await ownerSql`DELETE FROM clinic WHERE id = ${TEST_TENANT_B}`;
  });

  it('concurrent INSERTs for the same tenant do not fork the chain (P0-4 fix, advisory lock)', async () => {
    // Fire 2 concurrent INSERTs for the SAME tenant in parallel.
    // The advisory lock (pg_advisory_xact_lock) serializes them — one
    // commits before the other reads prev_hash. Both land; the chain
    // links correctly (the slower one's hash_prev == the faster one's
    // hash_curr).
    //
    // Without the advisory lock, both could read the same prev_hash
    // (NULL if this is the first row for the tenant, or the same prior
    // row's hash_curr), and both would compute their hash_curr from the
    // same input → both have the same hash_curr → the chain has a fork
    // (two rows with the same hash_prev, neither's hash_curr is the
    // other's hash_prev).
    //
    // Note: the advisory lock serializes per-tenant INSERTs, so the two
    // Promise.all INSERTs actually run sequentially at the DB layer.
    // The test verifies the chain links correctly under this serialization.

    const [result1, result2] = await Promise.all([
      withTenant(appSql, TEST_TENANT_A, async (tx) => {
        return await tx`
          INSERT INTO audit_log (tenant_id, actor_role, action, entity_type, entity_id, outcome)
          VALUES (${TEST_TENANT_A}, 'clinic_admin', 'test.p0_4_concurrent_1', 'test_entity', 'conc-1', 'success')
          RETURNING id, hash_prev, hash_curr
        `;
      }),
      withTenant(appSql, TEST_TENANT_A, async (tx) => {
        return await tx`
          INSERT INTO audit_log (tenant_id, actor_role, action, entity_type, entity_id, outcome)
          VALUES (${TEST_TENANT_A}, 'clinic_admin', 'test.p0_4_concurrent_2', 'test_entity', 'conc-2', 'success')
          RETURNING id, hash_prev, hash_curr
        `;
      }),
    ]);

    const r1 = result1[0];
    const r2 = result2[0];
    if (!r1 || !r2) throw new Error('concurrent rows not found');

    // Both rows landed (no deadlock, no serialization failure).
    expect(r1.id).toBeDefined();
    expect(r2.id).toBeDefined();

    // Order them by id (the advisory lock ensures one committed before
    // the other started).
    const [earlier, later] = r1.id < r2.id ? [r1, r2] : [r2, r1];

    // The P0-4 fix: later.hash_prev == earlier.hash_curr.
    // (Without the advisory lock, both could have hash_prev = NULL or
    // the same prior row's hash_curr, and the chain would fork.)
    expect(later.hash_prev).toBe(earlier.hash_curr);

    // The earlier row's hash_prev is either NULL (if no prior rows for
    // this tenant) or some prior row's hash_curr. Either way, the later
    // row's hash_prev must point to the earlier row's hash_curr — that's
    // the chain link the advisory lock guarantees.
    expect(earlier.hash_curr).toBeTruthy();
    expect(later.hash_curr).toBeTruthy();
    expect(earlier.hash_curr).not.toBe(later.hash_curr);
  });
});
