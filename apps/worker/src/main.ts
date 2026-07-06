// apps/worker/src/main.ts
//
// Worker bootstrap. Same NestJS + Fastify as apps/api (modular monolith
// per ADR-002 — the worker is a process, not a separate service).
// Listens on port 3002 for health checks.
//
// Phase 3 scaffold: idles (no queues registered yet). The BullMQ module
// is wired but has no queue processors. Phase 11 (Algerian Integrations)
// adds:
//   - SMS reminder crons (daily 09:00 Africa/Algiers)
//   - Chargily payment reconciliation (every 5 min)
//   - Backup verification (daily 02:00)
//   - Audit-log integrity check (hourly — verifies the SHA-256 hash chain)
//
// The worker connects to Redis (BullMQ's backend) via the REDIS_URL env
// var. In Phase 3 scaffold, the worker does NOT connect to Redis yet —
// the BullMQ module is registered but no queues are added, so no Redis
// connection is attempted until a queue is registered. Phase 4 adds
// Redis via docker-compose.

import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { WorkerModule } from './worker.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    WorkerModule,
    new FastifyAdapter({ logger: true }),
  );

  const port = Number.parseInt(process.env.PORT ?? '3002', 10);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
