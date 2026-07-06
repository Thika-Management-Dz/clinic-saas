// packages/db/src/seed.ts
//
// Phase 4.5.3 — Idempotent seed for local dev + staging.
// Per Roadmap v2.1 §4.5.3 and Blueprint §9.2 (RBAC role hierarchy).
//
// Seeds:
//   - 2 test clinics (Clinic A — dental-only, Clinic B — mixed medical + dental)
//   - 8 system roles (super_admin, clinic_admin, physician, dentist,
//     dental_assistant, nurse, receptionist, billing, pharmacist)
//   - Role inheritance edges (super_admin → clinic_admin → physician/dentist/...)
//   - 3 test users (clinic_admin, physician, receptionist) in Clinic A
//
// Idempotent: uses ON CONFLICT DO NOTHING. Safe to run multiple times.
//
// Usage:
//   pnpm --filter @clinic-saas/db db:seed
//
// Connects via MIGRATION_DATABASE_URL (ops_superuser / neondb_owner) so it
// can INSERT into clinic (no RLS) and set up the role hierarchy without
// needing a tenant context.

import postgres from 'postgres';

const dbUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('Neither MIGRATION_DATABASE_URL nor DATABASE_URL is set.');
  console.error('See .env.example Phase 4 section.');
  process.exit(1);
}

// dbUrl is narrowed to string after the if-check above.
const sql = postgres(dbUrl, {
  max: 1,
  ssl: 'require',
  idle_timeout: 5,
  connect_timeout: 10,
});

// Fixed UUIDs for deterministic seed (so tests can reference them).
const CLINIC_A_ID = '11111111-1111-1111-1111-111111111111';
const CLINIC_B_ID = '22222222-2222-2222-2222-222222222222';

const ROLE_KEYS = [
  'super_admin',
  'clinic_admin',
  'physician',
  'dentist',
  'dental_assistant',
  'nurse',
  'receptionist',
  'billing',
  'pharmacist',
] as const;

// Role inheritance edges (child inherits from parent).
// Per Blueprint §9.2: super_admin → clinic_admin → physician/dentist/nurse/...
const ROLE_INHERITANCE: Array<[child: string, parent: string]> = [
  ['clinic_admin', 'physician'],
  ['clinic_admin', 'dentist'],
  ['clinic_admin', 'nurse'],
  ['clinic_admin', 'receptionist'],
  ['clinic_admin', 'billing'],
  ['clinic_admin', 'pharmacist'],
  ['clinic_admin', 'dental_assistant'],
  ['super_admin', 'clinic_admin'],
];

async function main() {
  console.log('=== Seeding clinic-saas database ===');
  // dbUrl is guaranteed non-null after the early-exit check above.
  // The non-null assertion is safe here.
  console.log('  database:', dbUrl!.replace(/:[^:@]+@/, ':***@'));

  // -------------------------------------------------------------------------
  // 1. Seed clinics (idempotent via ON CONFLICT DO NOTHING)
  // -------------------------------------------------------------------------
  console.log('\n--- Clinics ---');
  await sql`
    INSERT INTO clinic (id, name, name_ar, license_number, address, phone, email)
    VALUES
      (${CLINIC_A_ID}, 'Clinic A — Dental Only', 'عيادة أ — أسنان فقط', 'LIC-001', '123 Rue Didouche Mourad, Alger', '+213 21 12 34 56', 'contact@clinic-a.test'),
      (${CLINIC_B_ID}, 'Clinic B — Medical + Dental', 'عيادة ب — طب وأسنان', 'LIC-002', '456 Bd Mohamed V, Oran', '+213 41 23 45 67', 'contact@clinic-b.test')
    ON CONFLICT (id) DO NOTHING
  `;
  console.log('  2 clinics seeded (or already existed)');

  // -------------------------------------------------------------------------
  // 2. Seed roles (idempotent via ON CONFLICT on key)
  // -------------------------------------------------------------------------
  console.log('\n--- Roles ---');
  for (const key of ROLE_KEYS) {
    const name = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    await sql`
      INSERT INTO role (key, name, description)
      VALUES (${key}, ${name}, ${`System role: ${key}`})
      ON CONFLICT (key) DO NOTHING
    `;
  }
  console.log(`  ${ROLE_KEYS.length} roles seeded (or already existed)`);

  // -------------------------------------------------------------------------
  // 3. Seed role inheritance (idempotent via ON CONFLICT on composite PK)
  // -------------------------------------------------------------------------
  console.log('\n--- Role inheritance ---');
  for (const [childKey, parentKey] of ROLE_INHERITANCE) {
    await sql`
      INSERT INTO role_inheritance (child_role_id, parent_role_id)
      SELECT c.id, p.id
      FROM role c, role p
      WHERE c.key = ${childKey} AND p.key = ${parentKey}
      ON CONFLICT (child_role_id, parent_role_id) DO NOTHING
    `;
  }
  console.log(`  ${ROLE_INHERITANCE.length} inheritance edges seeded`);

  // -------------------------------------------------------------------------
  // 4. Seed test users in Clinic A
  // -------------------------------------------------------------------------
  // Passwords are dev-only hashes (not real bcrypt hashes — just for seed).
  // Phase 5 will add proper password hashing via better-auth.
  console.log('\n--- Test users (Clinic A) ---');
  const users = [
    { email: 'admin@clinic-a.test', name: 'Test Admin', roleKey: 'clinic_admin' },
    { email: 'doctor@clinic-a.test', name: 'Test Physician', roleKey: 'physician' },
    { email: 'reception@clinic-a.test', name: 'Test Receptionist', roleKey: 'receptionist' },
  ];
  for (const u of users) {
    // Insert user (idempotent on email)
    await sql`
      INSERT INTO app_user (tenant_id, email, name, role_id, password_hash, is_active)
      SELECT
        ${CLINIC_A_ID},
        ${u.email},
        ${u.name},
        (SELECT id FROM role WHERE key = ${u.roleKey}),
        'dev_only_hash_not_real_bcrypt',
        true
      ON CONFLICT (email) DO NOTHING
    `;
    // Insert user_role (idempotent on tenant_id + user_id)
    await sql`
      INSERT INTO user_role (tenant_id, user_id, role_id)
      SELECT
        ${CLINIC_A_ID},
        app_user.id,
        (SELECT id FROM role WHERE key = ${u.roleKey})
      FROM app_user
      WHERE app_user.email = ${u.email}
      ON CONFLICT (tenant_id, user_id) DO NOTHING
    `;
  }
  console.log(`  ${users.length} test users seeded in Clinic A`);

  // -------------------------------------------------------------------------
  // 5. Summary
  // -------------------------------------------------------------------------
  console.log('\n=== Seed summary ===');
  const counts = await sql`
    SELECT
      (SELECT count(*)::int FROM clinic)           as clinics,
      (SELECT count(*)::int FROM role)             as roles,
      (SELECT count(*)::int FROM role_inheritance) as inheritance,
      (SELECT count(*)::int FROM app_user)         as users,
      (SELECT count(*)::int FROM user_role)        as user_roles
  `;
  const c = counts[0];
  if (!c) throw new Error('count query returned no rows');
  console.log(`  clinics:           ${c.clinics}`);
  console.log(`  roles:             ${c.roles}`);
  console.log(`  role_inheritance:  ${c.inheritance}`);
  console.log(`  app_user:          ${c.users}`);
  console.log(`  user_role:         ${c.user_roles}`);
  console.log('\n=== Seed complete ===');
  console.log('  Test logins (Clinic A):');
  console.log('    admin@clinic-a.test      (clinic_admin)');
  console.log('    doctor@clinic-a.test     (physician)');
  console.log('    reception@clinic-a.test  (receptionist)');
  console.log('  All passwords are dev-only — Phase 5 will add real auth.');

  await sql.end();
}

main().catch(async (err) => {
  console.error('Seed failed:', err);
  await sql.end();
  process.exit(1);
});
