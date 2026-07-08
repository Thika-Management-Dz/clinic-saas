// apps/api/src/infrastructure/rls/rls.module.ts
//
// RLS module. Per Roadmap v2.1 §5.3 and ADR-001.
//
// Self-registers TenantInterceptor as a global APP_INTERCEPTOR.
// The TenantInterceptor MUST run first (sets SET LOCAL for RLS).
// AppModule only imports this module — never imports internal files
// directly (per ADR-002).

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { TenantInterceptor } from './tenant.interceptor.js';

@Module({
  providers: [
    TenantInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
  exports: [TenantInterceptor],
})
export class RlsModule {}