// apps/api/src/infrastructure/egress/egress.module.ts
//
// EgressGuard module. Per Roadmap v2.1 §5.6 and Blueprint §3.
//
// Provides the EgressGuard as a global injectable service.
// TODO (Phase 13): Wire EgressGuard into outbound HTTP calls
// via a fetch interceptor or HttpService wrapper.

import { Module, Global } from '@nestjs/common';

import { EgressGuard, createEgressFetch } from './egress.guard.js';

@Global()
@Module({
  providers: [EgressGuard],
  exports: [EgressGuard, createEgressFetch],
})
export class EgressModule {}