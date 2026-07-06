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
        SELECT hash_curr FROM audit_log WHERE id < a.id ORDER BY id DESC LIMIT 1
      ) p ON true
      WHERE a.id = ${row.id}
    `;
    const r = recomputed[0];
    if (!r) throw new Error('recompute query returned no rows');
    expect(r.stored_hash).toBe(r.expected_hash);
  });
});
