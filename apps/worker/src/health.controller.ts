// apps/worker/src/health.controller.ts
// Mirror of apps/api/src/health.controller.ts — worker health endpoint.

import { Controller, Get } from '@nestjs/common';
import { HealthService, type WorkerHealthStatus } from './health.service.js';

@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  check(): WorkerHealthStatus {
    return this.health.check();
  }
}
