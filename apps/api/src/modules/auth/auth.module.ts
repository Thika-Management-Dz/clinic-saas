// apps/api/src/modules/auth/auth.module.ts
//
// NestJS module for Better Auth and session management.
// Per Roadmap v2.1 §5.2.1 and §5.3.
//
// This module provides:
//   - AuthController: mounts Better Auth's request handler at /api/auth/*
//   - SessionController: custom endpoints (switch-tenant, /me)
//   - PermissionsGuard: RBAC permission checking (Phase 10)

import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller.js';
import { SessionController } from './session.controller.js';

@Module({
  controllers: [AuthController, SessionController],
  providers: [],
  exports: [],
})
export class AuthModule {}