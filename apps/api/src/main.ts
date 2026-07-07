// apps/api/src/main.ts
//
// NestJS bootstrap with Fastify adapter. Modular monolith per ADR-002.
// Listens on port 3001 (per Roadmap v2.1 §3.6.4).
//
// Phase 3 scaffold: minimal. Phase 4 adds the Drizzle DB connection.
// Phase 5 adds Better Auth + the tenant interceptor (SET LOCAL
// app.current_tenant). Phase 7 adds Sentry + PostHog integrations.
// Phase 13 adds CSP + EgressGuard interceptors.

import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { AppModule } from './app.module.js';

/**
 * Defense-in-depth: fail-fast if NODE_ENV=production and DATABASE_URL
 * contains a dev-only credential pattern. This catches misconfigured
 * production deployments at boot, not at runtime. Part of 30-3 (P0-2).
 *
 * The patterns match the dev-only defaults that used to be hardcoded in
 * 001_roles.sql (now parameterized). A production DATABASE_URL must use
 * rotated credentials per ADR-011 and docs/runbooks/neon-staging.md.
 */
const DEV_CREDENTIAL_PATTERNS = [
  'dev_password',
  'dev_ops_password',
  'dev_postgres_password',
] as const;

function assertNoDevCredentialsInProduction(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const databaseUrl = process.env.DATABASE_URL ?? '';
  for (const pattern of DEV_CREDENTIAL_PATTERNS) {
    if (databaseUrl.includes(pattern)) {
      throw new Error(
        `FATAL: DATABASE_URL contains dev-only credential pattern "${pattern}" ` +
          `in production. This is a misconfiguration — production must use ` +
          `rotated credentials. See docs/remediation/30-60-90-day-plan.md (30-3) ` +
          `and docs/runbooks/neon-staging.md.`,
      );
    }
  }
}

async function bootstrap(): Promise<void> {
  assertNoDevCredentialsInProduction();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  const port = Number.parseInt(process.env.PORT ?? '3001', 10);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
