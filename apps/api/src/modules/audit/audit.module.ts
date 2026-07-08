// apps/api/src/modules/audit/audit.module.ts
//
// Audit module. Per Roadmap v2.1 §5.5 and Blueprint §9.7.
//
// Self-registers AuditInterceptor as a global APP_INTERCEPTOR.
// AppModule only imports this module — never imports internal files
// directly (per ADR-002).

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';


import { AuditInterceptor } from './audit.interceptor.js';

@Module({
  providers: [
    AuditInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditInterceptor],
})
export class AuditModule {}