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

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  const port = Number.parseInt(process.env.PORT ?? '3001', 10);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
