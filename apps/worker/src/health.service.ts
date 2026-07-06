// apps/worker/src/health.service.ts
// Mirror of apps/api/src/health.service.ts — worker health check.

import { Injectable } from '@nestjs/common';

export interface WorkerHealthStatus {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  queues: string[];
}

@Injectable()
export class HealthService {
  check(): WorkerHealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      // Phase 3 scaffold: no queues registered yet.
      // Phase 11 will list the active queue names.
      queues: [],
    };
  }
}
