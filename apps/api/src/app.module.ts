// apps/api/src/app.module.ts
//
// Root NestJS module for the @clinic-saas/api app (modular monolith per
// ADR-002). Phase 3 scaffold: only the HealthController is registered.
//
// Subsequent phases add feature modules:
//   - Phase 4: DbModule (Drizzle connection + RLS middleware)
//   - Phase 5: AuthModule (Better Auth) + TenantInterceptor + AuditInterceptor
//   - Phase 10: PatientModule, EncounterModule, DentalModule,
//     AppointmentModule (each with their own index.ts public API per
//     Blueprint §7.4 — cross-module imports go through index.ts only)
//   - Phase 11: BillingModule, ChargilyModule, EInvoicingModule
//
// Cross-module write-side effects go through EventEmitter2 (in-process
// event bus per Blueprint §7.2). Event payloads are JSON-serializable.

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';
import { EgressGuard } from './infrastructure/egress/egress.guard.js';
import { TenantInterceptor } from './infrastructure/rls/tenant.interceptor.js';
import { AuditInterceptor } from './modules/audit/audit.interceptor.js';
import { AuthModule } from './modules/auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [HealthController],
  providers: [
    HealthService,

    // Global interceptors — run on every request across all modules.
    // TenantInterceptor MUST run first (sets SET LOCAL for RLS).
    // AuditInterceptor runs after the handler (writes audit_log).
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },

    // EgressGuard: registered as a provider for Phase 13 integration.
    // Phase 13 will inject this into the fetch/HttpService interceptor.
    EgressGuard,
  ],
})
export class AppModule {}