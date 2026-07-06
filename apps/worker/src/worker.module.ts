// apps/worker/src/worker.module.ts
//
// Root NestJS module for the @clinic-saas/worker app.
//
// Phase 3 scaffold: registers BullMQ (no queues yet — worker idles).
// Also registers a HealthController for liveness probes on port 3002.
//
// Phase 11 will add queue processors:
//   - sms-reminder-queue (cron: daily 09:00 Africa/Algiers)
//   - payment-reconciliation-queue (cron: every 5 min)
//   - backup-verification-queue (cron: daily 02:00)
//   - audit-integrity-check-queue (cron: hourly)
//
// Each queue processor emits domain events via EventEmitter2 (per
// Blueprint §7.2) so the API can react without direct service calls.

import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

@Module({
  imports: [
    // BullMQ is registered but no queues are added yet — no Redis
    // connection is attempted until a queue is registered. The
    // connection config is read from REDIS_URL at runtime when the
    // first queue is added in Phase 11.
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          url: process.env.REDIS_URL ?? 'redis://localhost:6379',
        },
      }),
    }),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class WorkerModule {}
