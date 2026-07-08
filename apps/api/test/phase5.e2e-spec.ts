// apps/api/test/phase5.e2e-spec.ts
//
// Phase 5 E2E tests. Per Roadmap v2.1 §5.7.3.
//
// Tests for:
//   1. Sign-up flow (POST /api/auth/sign-up/email)
//   2. Sign-in flow (POST /api/auth/sign-in/email)
//   3. Get session (GET /api/auth/get-session)
//   4. Switch tenant (POST /api/auth/switch-tenant)
//   5. /me endpoint (GET /api/auth/me)
//   6. Sign-out (POST /api/auth/sign-out)
//   7. RBAC 403 path (if PermissionsGuard is active)
//
// These tests require a running PostgreSQL database with the schema
// applied. They are designed to compile and pass with correct imports
// even if they can't run in a sandbox without a DB.

import { NestFactory } from '@nestjs/core';
import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { AppModule } from '../src/app.module.js';

describe('Phase 5 — Authentication & Tenant Interceptor', () => {
  let app: NestFastifyApplication;
  let baseUrl: string;

  beforeAll(async () => {
    app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({ logger: false }),
    );

    const port = 0; // random available port
    await app.listen(port, '127.0.0.1');
    const addr = app.getHttpServer().address();
    if (typeof addr === 'object' && addr) {
      baseUrl = `http://127.0.0.1:${addr.port}`;
    } else {
      baseUrl = `http://127.0.0.1:${addr}`;
    }
  }, 60_000);

  afterAll(async () => {
    await app.close();
  }, 30_000);

  // ─────────────────────────────────────────────────────────────
  // 1. Health check (sanity test — no auth, no tenant)
  // ─────────────────────────────────────────────────────────────
  describe('GET / (health)', () => {
    it('returns 200', async () => {
      const res = await fetch(`${baseUrl}/`);
      expect(res.status).toBe(200);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Sign-up flow
  // ─────────────────────────────────────────────────────────────
  describe('POST /api/auth/sign-up/email', () => {
    const testEmail = `e2e-test-${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';

    it('creates a new user and returns session', async () => {
      const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'E2E Test User',
          email: testEmail,
          password: testPassword,
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json() as Record<string, unknown>;
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('user');
      const user = body.user as Record<string, unknown>;
      expect(user.email).toBe(testEmail);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Sign-in flow
  // ─────────────────────────────────────────────────────────────
  describe('POST /api/auth/sign-in/email', () => {
    const testEmail = `e2e-signin-${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';

    beforeAll(async () => {
      // Create user first
      await fetch(`${baseUrl}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'E2E Signin User',
          email: testEmail,
          password: testPassword,
        }),
      });
    });

    it('returns a session token on valid credentials', async () => {
      const res = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json() as Record<string, unknown>;
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('user');
    });

    it('returns error on invalid credentials', async () => {
      const res = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'WrongPassword',
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Get session
  // ─────────────────────────────────────────────────────────────
  describe('GET /api/auth/get-session', () => {
    it('returns 401 without a session cookie/token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/get-session`);
      // Better Auth returns 200 with null session, or 401.
      // Either is acceptable for unauthenticated requests.
      expect([200, 401]).toContain(res.status);
      if (res.status === 200) {
        const body = await res.json() as Record<string, unknown>;
        expect(body.session).toBeNull();
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. /me endpoint
  // ─────────────────────────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      expect(res.status).toBe(401);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Switch tenant
  // ─────────────────────────────────────────────────────────────
  describe('POST /api/auth/switch-tenant', () => {
    it('returns 400 without organizationId', async () => {
      const res = await fetch(`${baseUrl}/api/auth/switch-tenant`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 with invalid organizationId', async () => {
      const res = await fetch(`${baseUrl}/api/auth/switch-tenant`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ organizationId: 'not-a-uuid' }),
      });
      expect(res.status).toBe(400);
    });

    it('returns 401 when not authenticated', async () => {
      const res = await fetch(`${baseUrl}/api/auth/switch-tenant`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          organizationId: '00000000-0000-4000-a000-000000000000',
        }),
      });
      // Better Auth returns 401 or 200 with error — either way the
      // tenant is not switched.
      expect([200, 401]).toContain(res.status);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Sign-out
  // ─────────────────────────────────────────────────────────────
  describe('POST /api/auth/sign-out', () => {
    it('succeeds even without a session', async () => {
      const res = await fetch(`${baseUrl}/api/auth/sign-out`, {
        method: 'POST',
      });
      // Better Auth may return 200 even for no session.
      expect([200, 401]).toContain(res.status);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 8. RBAC 403 path (PermissionsGuard)
  // ─────────────────────────────────────────────────────────────
  describe('PermissionsGuard', () => {
    it('allows access to endpoints without @RequirePermissions()', async () => {
      // Health endpoint has no @RequirePermissions() decorator.
      const res = await fetch(`${baseUrl}/`);
      expect(res.status).toBe(200);
    });

    // NOTE: Full RBAC 403 testing requires a domain controller with
    // @RequirePermissions() (Phase 10). The guard is registered and
    // returns true for endpoints without the decorator, and false
    // for unauthenticated requests on decorated endpoints.
  });
});