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
    // SSL is required for Neon staging (sslmode=require in the URL) but
    // NOT for the docker-compose Postgres container (no SSL configured).
    // Respect the URL's sslmode param so the same helpers work in both
    // environments + in CI (which uses the docker container).
    ssl: url.includes('sslmode=require') ? 'require' : false,
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
    // See connectAsApp() for the SSL-conditional rationale.
    ssl: url.includes('sslmode=require') ? 'require' : false,
    idle_timeout: 5,
    connect_timeout: 10,
  });
}

/**
 * Run a function inside a transaction with SET LOCAL app.current_tenant.
 * The transaction auto-rolls-back when fn returns or throws (test isolation).
 *
 * P0-3 FIX (PR2 / Task 20-b, 2026-07-07): added UUID regex validation
 * before the string interpolation. The OLD code did
 * `tx.unsafe(\`SET LOCAL app.current_tenant = '${tenantId}'\`)` with no
 * validation — safe today because tests use hardcoded UUIDs from
 * TEST_TENANT_A / TEST_TENANT_B, but if this pattern leaked into the
 * Phase 5 TenantInterceptor, any user-controlled value flowing into the
 * tenant context would be a SQL injection vector. The regex check throws
 * early if tenantId is not a valid UUID, so even if a future caller
 * passes an attacker-controlled string, it can never reach the
 * interpolation. See docs/audits/2026-07-07-critical-review.md §3.3
 * (P0-3) and docs/adr/ADR-001.md (RLS pool model).
 *
 * Phase 5's TenantInterceptor MUST use a parameterized set_tenant(p_tenant uuid)
 * SECURITY DEFINER function instead of this unsafe() pattern. The function
 * is added in this PR as packages/db/sql/004_set_tenant.sql. The
 * TenantInterceptor will call `SELECT set_tenant($1)` with a parameterized
 * query, eliminating the string interpolation entirely. This withTenant
 * helper remains for tests (where the input is always a hardcoded UUID)
 * but should NOT be the template for production code.
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
  // P0-3 fix: validate tenantId is a valid UUID before interpolation.
  // Throws early if it's not — never reaches the unsafe() call.
  // The regex matches the canonical 8-4-4-4-12 hex format (RFC 4122).
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(tenantId)) {
    throw new Error(
      `withTenant: tenantId must be a valid UUID (got "${tenantId}"). ` +
        'Phase 5 TenantInterceptor must use the parameterized set_tenant(uuid) ' +
        'SECURITY DEFINER function instead of this helper. See ADR-001 and ' +
        'the critical review P0-3 (docs/audits/2026-07-07-critical-review.md §3.3).',
    );
  }

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
