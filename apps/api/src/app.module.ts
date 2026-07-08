// apps/api/src/app.module.ts
//
// Root NestJS module for the @clinic-saas/api app (modular monolith per
// ADR-002). Phase 3 scaffold: only the HealthController is registered.
//
// Subsequent phases add feature modules:
//   - Phase 4: DbModule (Drizzle connection + RLS middleware)
//   - Phase 5: AuthModule (Better Auth) + RlsModule + AuditModule
//   - Phase 10: PatientModule, EncounterModule, DentalModule,
//     AppointmentModule (each with their own index.ts public API per
//     Blueprint §7.4 — cross-module imports go through index.ts only)
//   - Phase 11: BillingModule, ChargilyModule, EInvoicingModule
//
// Cross-module write-side effects go through EventEmitter2 (in-process
// event bus per Blueprint §7.2). Event payloads are JSON-serializable.
//
// ADR-002: No direct internal imports. All cross-module access goes
// through index.ts barrel exports or module imports.

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

// Module imports only — never import internal files directly (ADR-002).
import { AuthModule } from './modules/auth/index.js';
import { AuditModule } from './modules/audit/index.js';
import { RlsModule } from './infrastructure/rls/index.js';
import { EgressModule } from './infrastructure/egress/index.js';

// PermissionsGuard from the auth module's public API.
import { PermissionsGuard } from './modules/auth/index.js';

@Module({
  imports: [AuthModule, AuditModule, RlsModule, EgressModule],
  controllers: [HealthController],
  providers: [
    HealthService,

    // Global guard: RBAC permission checking.
    // Registered here so @RequirePermissions() decorators work across
    // all modules. The guard itself is provided by AuthModule.
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}