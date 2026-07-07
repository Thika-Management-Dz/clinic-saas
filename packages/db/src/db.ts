// packages/db/src/db.ts
//
// Drizzle database instance. Per Roadmap v2.1 §4.2 and ADR-001.
//
// Creates the postgres.js connection and wraps it in Drizzle ORM.
// The Drizzle instance is the primary query builder; the raw postgres.js
// client is exported as `sql` for use-cases that need parameterized
// queries (e.g., TenantInterceptor calling SELECT set_tenant($1)).

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. See .env.example Phase 4 section.');
}

// Create the postgres.js connection.
// max: 1 is safe for now; will be tuned in Phase 7 (connection pooling).
const client = postgres(DATABASE_URL, {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
});

export const db = drizzle(client);

// Export the raw client for use with parameterized set_tenant() calls.
// The TenantInterceptor (Phase 5.3) needs the raw postgres.js client
// to call SELECT set_tenant($1) inside a transaction.
export { client as sql };