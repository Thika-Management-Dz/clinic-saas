// apps/api/src/modules/auth/auth.module.ts
//
// NestJS module for Better Auth. Per Roadmap v2.1 §5.2.1.
//
// This module provides the AuthController which mounts Better Auth's
// request handler. Better Auth manages its own routes under /api/auth/*.

import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller.js';

@Module({
  controllers: [AuthController],
})
export class AuthModule {}