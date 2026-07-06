// apps/api/src/app.module.ts
//
// Root NestJS module for the @clinic-saas/api app (modular monolith per
// ADR-002). Phase 3 scaffold: only the HealthController is registered.
//
// Subsequent phases add feature modules:
//   - Phase 4: DbModule (Drizzle connection + RLS middleware)
//   - Phase 5: AuthModule (Better Auth) + TenantInterceptor
//   - Phase 10: PatientModule, EncounterModule, DentalModule,
//     AppointmentModule (each with their own index.ts public API per
//     Blueprint §7.4 — cross-module imports go through index.ts only)
//   - Phase 11: BillingModule, ChargilyModule, EInvoicingModule
//
// Cross-module write-side effects go through EventEmitter2 (in-process
// event bus per Blueprint §7.2). Event payloads are JSON-serializable.

import { Module } from '@nestjs/common';

import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
