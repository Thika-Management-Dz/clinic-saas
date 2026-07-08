// apps/api/src/health.controller.ts
//
// Health check endpoint. GET / returns the health status JSON.
// Per Roadmap v2.1 §3.6.4: 'GET / must return a 200'.

import { Controller, Get, Inject } from '@nestjs/common';

import { HealthService, type HealthStatus } from './health.service.js';

@Controller()
export class HealthController {
  constructor(@Inject(HealthService) private readonly health: HealthService) {}

  @Get()
  check(): HealthStatus {
    return this.health.check();
  }
}
