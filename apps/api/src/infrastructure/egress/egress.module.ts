// apps/api/src/infrastructure/egress/egress.module.ts
//
// EgressGuard module. Per Roadmap v2.1 §5.6 and Blueprint §3.
//
// Provides the EgressGuard as a global injectable service.

import { Module, Global } from '@nestjs/common';
import { EgressGuard } from './egress.guard.js';

@Global()
@Module({
  providers: [EgressGuard],
  exports: [EgressGuard],
})
export class EgressModule {}