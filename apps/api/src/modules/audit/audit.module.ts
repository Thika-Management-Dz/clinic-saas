// apps/api/src/modules/audit/audit.module.ts
//
// Audit module. Per Roadmap v2.1 §5.5 and Blueprint §9.7.
//
// Provides the AuditInterceptor as a global provider.

import { Module } from '@nestjs/common';
import { AuditInterceptor } from './audit.interceptor.js';

@Module({
  providers: [AuditInterceptor],
  exports: [AuditInterceptor],
})
export class AuditModule {}