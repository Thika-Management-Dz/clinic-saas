// packages/db/drizzle.config.ts
//
// Drizzle Kit configuration. Per Roadmap v2.1 §3.9.3 and §4.4.
//
// Two connection strings (per ADR-001 and .env.example Phase 4 section):
//
// 1. MIGRATION_DATABASE_URL — connects as ops_superuser (BYPASSRLS). Used
//    by db:migrate and db:generate (when --execute is passed). Migrations
//    must run as a role that can CREATE TABLE, CREATE POLICY, etc. The
//    tables are owned by ops_superuser; with FORCE ROW LEVEL SECURITY
//    (added via packages/db/sql/003_force_rls.sql), the owner is subject
//    to RLS, but BYPASSRLS lets ops_superuser ignore policies for admin
//    operations.
//
// 2. DATABASE_URL — connects as app_role (NOBYPASSRLS). Used by the app
//    at runtime (apps/api, apps/worker, apps/web). RLS policies are
//    enforced on every query.
//
// This config prefers MIGRATION_DATABASE_URL (so `pnpm db:migrate` uses
// ops_superuser) and falls back to DATABASE_URL if MIGRATION_DATABASE_URL
// is not set (e.g., in CI environments that only provide one URL).

import { defineConfig } from 'drizzle-kit';

const migrationUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error(
    'Neither MIGRATION_DATABASE_URL nor DATABASE_URL is set. ' +
      'See .env.example Phase 4 section.',
  );
}

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: migrationUrl,
  },
  verbose: true,
  strict: true,
});
