// packages/db/src/__tests__/helpers.ts
//
// Test helpers for RLS + audit_log tests (Phase 4.6, PR E).
//
// Provides:
//   - connectAsApp(): postgres.js client connected as app_role (NOBYPASSRLS).
//     RLS policies are enforced on every query.
//   - connectAsOwner(): postgres.js client connected as the migration role
//     (ops_superuser on docker-compose, neondb_owner on Neon staging).
//     BYPASSRLS — used for setup/teardown.
//   - TEST_TENANT_A / TEST_TENANT_B: fixed UUIDs for two test tenants.
//   - withTenant(sql, tenantId, fn): runs fn inside a transaction with
//     SET LOCAL app.current_tenant = tenantId. Auto-rolls-back.
//
// Environment:
//   - DATABASE_URL: the app_role connection (RLS enforced).
//   - MIGRATION_DATABASE_URL: the owner connection (BYPASSRLS).
//
// If DATABASE_URL is not set, tests FAIL (not skip). Per the testing
// conventions doc discussion, RLS tests MUST run — skipping them would
// hide a compliance violation. The CI pipeline must provide DATABASE_URL.

import postgres from 'postgres';

export const TEST_TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
export const TEST_TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/**
 * Connect as app_role (NOBYPASSRLS). RLS policies are enforced.
 * The caller is responsible for calling sql.end() when done.
 */
export function connectAsApp() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. RLS tests require a real Postgres ' +
        'connection as app_role. Do NOT skip — failing is correct.',
    );
  }
  return postgres(url, {
    max: 1,
    ssl: 'require',
    idle_timeout: 5,
    connect_timeout: 10,
  });
}

/**
 * Connect as the migration role (ops_superuser / neondb_owner, BYPASSRLS).
 * Used for setup/teardown (inserting test clinics, cleaning up).
 * The caller is responsible for calling sql.end() when done.
 */
export function connectAsOwner() {
  const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('MIGRATION_DATABASE_URL or DATABASE_URL is not set.');
  }
  return postgres(url, {
    max: 1,
    ssl: 'require',
    idle_timeout: 5,
    connect_timeout: 10,
  });
}

/**
 * Run a function inside a transaction with SET LOCAL app.current_tenant.
 * The transaction auto-rolls-back when fn returns or throws (test isolation).
 *
 * NOTE: the return type is cast to T because postgres.js's `sql.begin()`
 * uses `UnwrapPromiseArray<T>` which doesn't compose cleanly with generics.
 * The runtime behavior is correct — the callback's resolved value is
 * returned as-is when it's not a single postgres row.
 *
 * Usage:
 *   const rows = await withTenant(appSql, TEST_TENANT_A, async (tx) => {
 *     return await tx`SELECT * FROM app_user`;
 *   });
 */
export async function withTenant<T>(
  sql: postgres.Sql,
  tenantId: string,
  fn: (tx: postgres.TransactionSql) => Promise<T>,
): Promise<T> {
   
  const result = await sql.begin(async (tx) => {
    await tx.unsafe(`SET LOCAL app.current_tenant = '${tenantId}'`);
    return await fn(tx);
  });
  return result as T;
}

/**
 * Insert a test clinic (as owner, bypassing RLS). Idempotent.
 */
export async function ensureTestClinic(
  ownerSql: postgres.Sql,
  id: string,
  name: string,
): Promise<void> {
  await ownerSql`
    INSERT INTO clinic (id, name) VALUES (${id}, ${name})
    ON CONFLICT (id) DO NOTHING
  `;
}

/**
 * Clean up test data (as owner). Call in afterEach / afterAll.
 * Deletes in dependency order (FK constraints).
 */
export async function cleanupTestData(ownerSql: postgres.Sql): Promise<void> {
  // audit_log first (references app_user via actor_user_id, clinic via tenant_id)
  await ownerSql`DELETE FROM audit_log WHERE tenant_id IN (${TEST_TENANT_A}, ${TEST_TENANT_B})`;
  // user_role (references app_user, clinic, role)
  await ownerSql`DELETE FROM user_role WHERE tenant_id IN (${TEST_TENANT_A}, ${TEST_TENANT_B})`;
  // app_user (references clinic, role)
  await ownerSql`DELETE FROM app_user WHERE tenant_id IN (${TEST_TENANT_A}, ${TEST_TENANT_B})`;
  // clinic (referenced by everything)
  await ownerSql`DELETE FROM clinic WHERE id IN (${TEST_TENANT_A}, ${TEST_TENANT_B})`;
}
