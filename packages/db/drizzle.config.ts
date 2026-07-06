// packages/db/drizzle.config.ts
//
// Drizzle Kit configuration. Per Roadmap v2.1 §3.9.3.
// The DATABASE_URL env var is provided by .env.local (see .env.example).
// In Phase 3, no migrations are generated yet (schema is empty). Phase 4
// will introduce the first migration (clinic + audit_log tables).

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
