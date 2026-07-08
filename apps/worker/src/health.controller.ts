// apps/worker/src/health.controller.ts
// Mirror of apps/api/src/health.controller.ts — worker health endpoint.
//
// NOTE: explicit @Inject(Token) is REQUIRED here per ADR-013 — the worker
// runs via tsx (esbuild) in dev mode, and esbuild does not emit
// emitDecoratorMetadata, so implicit constructor injection is undefined
// at runtime without it.

import { Controller, Get, Inject } from '@nestjs/common';

import { HealthService, type WorkerHealthStatus } from './health.service.js';

@Controller()
export class HealthController {
  constructor(@Inject(HealthService) private readonly health: HealthService) {}

  @Get()
  check(): WorkerHealthStatus {
    return this.health.check();
  }
}
