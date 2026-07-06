// apps/api/src/health.service.ts
//
// Health check service. Returns a JSON status payload.
// Phase 3 scaffold: always returns { status: 'ok' }.
// Phase 4 will add DB connectivity check.
// Phase 12 will add Redis + Chargily + Orthanc connectivity checks.

import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
}

@Injectable()
export class HealthService {
  check(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
