// packages/db/src/__tests__/rls.test.ts
//
// Phase 4.6 — RLS cross-tenant isolation tests.
// Per Roadmap v2.1 §4.6.1 and docs/conventions/testing.md §3.2.
//
// This is the COMPLIANCE GATE. If any test fails, DO NOT proceed to Phase 5.
// A failure means patient data could leak across clinics — a critical
// violation of Algerian Law 18-07.
//
// Tests:
//   1. app_role has NO BYPASSRLS (the single most important guarantee).
//   2. ops_superuser HAS BYPASSRLS.
//   3. Every tenant-scoped table has ENABLE + FORCE ROW LEVEL SECURITY.
//   4. Cross-tenant SELECT returns 0 rows (tenant A cannot read tenant B).
//   5. WITH CHECK policy denies cross-tenant INSERT (tenant A cannot write
//      a row claiming tenant_id = tenant B).
//   6. No current_tenant set → 0 rows visible (app MUST set tenant context).

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
  await ensureTestClinic(ownerSql, TEST_TENANT_A, 'RLS Test Clinic A');
  await ensureTestClinic(ownerSql, TEST_TENANT_B, 'RLS Test Clinic B');
});

afterAll(async () => {
  await cleanupTestData(ownerSql);
  await appSql.end();
  await ownerSql.end();
});

// Clean up app_user rows between tests (each test inserts its own)
beforeEach(async () => {
  await ownerSql`DELETE FROM app_user WHERE tenant_id IN (${TEST_TENANT_A}, ${TEST_TENANT_B})`;
});

describe('RLS role configuration', () => {
  it('app_role does NOT have BYPASSRLS (the single most important guarantee)', async () => {
    const rows = await ownerSql`
      SELECT rolname, rolbypassrls
      FROM pg_roles
      WHERE rolname = 'app_role'
    `;
    expect(rows.length).toBe(1);
    const row = rows[0];
    if (!row) throw new Error('app_role not found');
    expect(row.rolbypassrls).toBe(false);
  });

  it('ops_superuser HAS BYPASSRLS (or neondb_owner does, on Neon)', async () => {
    // On docker-compose, ops_superuser has BYPASSRLS.
    // On Neon, neondb_owner has BYPASSRLS (and ops_superuser may also).
    // At least one of them must have it.
    const rows = await ownerSql`
      SELECT rolname, rolbypassrls
      FROM pg_roles
      WHERE rolname IN ('ops_superuser', 'neondb_owner') AND rolbypassrls = true
    `;
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('RLS table configuration (FORCE ROW LEVEL SECURITY)', () => {
  it('every tenant-scoped table has ENABLE + FORCE RLS', async () => {
    // Per AGENTS.md Do-NOT #12: no tenant-scoped table without ENABLE + FORCE RLS.
    // The tenant-scoped tables in Phase 4 are: app_user, user_role, audit_log.
    const tenantTables = ['app_user', 'user_role', 'audit_log'];
    const rows = await ownerSql`
      SELECT relname, relrowsecurity, relforcerowsecurity
      FROM pg_class
      WHERE relnamespace = 'public'::regnamespace
        AND relkind = 'r'
        AND relname = ANY(${tenantTables})
    `;
    expect(rows.length).toBe(3);
    for (const row of rows) {
      if (!row) continue;
      expect(row.relrowsecurity, `${row.relname} should have ENABLE RLS`).toBe(true);
      expect(row.relforcerowsecurity, `${row.relname} should have FORCE RLS`).toBe(true);
    }
  });

  it('non-tenant-scoped tables do NOT have RLS (clinic, role, privilege, etc.)', async () => {
    const nonTenantTables = ['clinic', 'role', 'privilege', 'role_privilege', 'role_inheritance'];
    const rows = await ownerSql`
      SELECT relname, relrowsecurity
      FROM pg_class
      WHERE relnamespace = 'public'::regnamespace
        AND relkind = 'r'
        AND relname = ANY(${nonTenantTables})
    `;
    expect(rows.length).toBe(5);
    for (const row of rows) {
      if (!row) continue;
      expect(row.relrowsecurity, `${row.relname} should NOT have RLS`).toBe(false);
    }
  });
});

describe('RLS cross-tenant isolation (the core compliance guarantee)', () => {
  it('tenant A cannot read tenant B rows (SELECT)', async () => {
    // Insert a user in tenant A as owner (bypassing RLS for setup)
    await ownerSql`
      INSERT INTO app_user (tenant_id, email, name, password_hash)
      VALUES (${TEST_TENANT_A}, 'tenant-a-user@test', 'User A', 'hash')
      ON CONFLICT (email) DO NOTHING
    `;

    // As app_role with tenant B context, SELECT should return 0 rows
    const rowsFromB = await withTenant(appSql, TEST_TENANT_B, async (tx) => {
      return await tx`SELECT email FROM app_user`;
    });
    expect(rowsFromB.length).toBe(0);
  });

  it('tenant A can read its own rows (SELECT)', async () => {
    await ownerSql`
      INSERT INTO app_user (tenant_id, email, name, password_hash)
      VALUES (${TEST_TENANT_A}, 'own-user@test', 'Own User', 'hash')
      ON CONFLICT (email) DO NOTHING
    `;

    const rows = await withTenant(appSql, TEST_TENANT_A, async (tx) => {
      return await tx`SELECT email FROM app_user WHERE email = 'own-user@test'`;
    });
    expect(rows.length).toBe(1);
    const row = rows[0];
    if (!row) throw new Error('expected row not found');
    expect(row.email).toBe('own-user@test');
  });

  it('WITH CHECK policy denies cross-tenant INSERT (tenant A cannot write tenant_id=B)', async () => {
    // As app_role with tenant A context, try to INSERT a row with tenant_id=B.
    // The WITH CHECK policy should deny this.
    await expect(
      withTenant(appSql, TEST_TENANT_A, async (tx) => {
        await tx`
          INSERT INTO app_user (tenant_id, email, name, password_hash)
          VALUES (${TEST_TENANT_B}, 'cross-tenant@test', 'Cross', 'hash')
        `;
      }),
    ).rejects.toThrow(/row-level security policy|permission denied/);
  });

  it('app_role can INSERT into its own tenant (WITH CHECK passes)', async () => {
    await withTenant(appSql, TEST_TENANT_A, async (tx) => {
      await tx`
        INSERT INTO app_user (tenant_id, email, name, password_hash)
        VALUES (${TEST_TENANT_A}, 'valid-insert@test', 'Valid', 'hash')
      `;
    });

    // Verify the row is visible
    const rows = await withTenant(appSql, TEST_TENANT_A, async (tx) => {
      return await tx`SELECT email FROM app_user WHERE email = 'valid-insert@test'`;
    });
    expect(rows.length).toBe(1);
  });
});

describe('RLS without tenant context', () => {
  it('app_role SELECT without current_tenant returns 0 rows', async () => {
    // Insert a row as owner (setup)
    await ownerSql`
      INSERT INTO app_user (tenant_id, email, name, password_hash)
      VALUES (${TEST_TENANT_A}, 'no-context@test', 'No Context', 'hash')
      ON CONFLICT (email) DO NOTHING
    `;

    // As app_role WITHOUT setting current_tenant, SELECT should return 0 rows.
    // This is because NULLIF(current_setting('app.current_tenant', true), '')
    // returns NULL when the setting is missing, and tenant_id = NULL is false.
    const rows = await appSql`SELECT email FROM app_user`;
    expect(rows.length).toBe(0);
  });
});

describe('app_role privilege restrictions', () => {
  it('app_role does NOT have TRUNCATE on any table (RLS bypass)', async () => {
    // RLS does not apply to TRUNCATE. If app_role had TRUNCATE, a buggy app
    // could TRUNCATE a tenant's data, bypassing RLS entirely.
    const tables = ['app_user', 'user_role', 'audit_log', 'clinic', 'role'];
    for (const table of tables) {
      const rows = await ownerSql`
        SELECT has_table_privilege('app_role', ${table}, 'TRUNCATE') as can_truncate
      `;
      const row = rows[0];
      if (!row) throw new Error(`privilege check failed for ${table}`);
      expect(row.can_truncate, `app_role should NOT have TRUNCATE on ${table}`).toBe(false);
    }
  });

  it('app_role does NOT have DELETE on audit_log (append-only)', async () => {
    // PR D revoked DELETE on audit_log. This is the tamper-evidence guarantee.
    const rows = await ownerSql`
      SELECT has_table_privilege('app_role', 'audit_log', 'DELETE') as can_delete
    `;
    const row = rows[0];
    if (!row) throw new Error('privilege check failed');
    expect(row.can_delete).toBe(false);
  });

  it('app_role does NOT have UPDATE on audit_log (append-only)', async () => {
    const rows = await ownerSql`
      SELECT has_table_privilege('app_role', 'audit_log', 'UPDATE') as can_update
    `;
    const row = rows[0];
    if (!row) throw new Error('privilege check failed');
    expect(row.can_update).toBe(false);
  });

  it('app_role HAS SELECT, INSERT, UPDATE on tenant-scoped tables (for normal use)', async () => {
    const tables = ['app_user', 'user_role', 'audit_log'];
    for (const table of tables) {
      const rows = await ownerSql`
        SELECT has_table_privilege('app_role', ${table}, 'SELECT, INSERT, UPDATE') as can_dml
      `;
      const row = rows[0];
      if (!row) throw new Error(`privilege check failed for ${table}`);
      expect(row.can_dml, `app_role should have DML on ${table}`).toBe(true);
    }
  });
});
