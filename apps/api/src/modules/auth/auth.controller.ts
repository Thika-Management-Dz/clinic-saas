// apps/api/src/modules/auth/auth.controller.ts
//
// Mounts Better Auth's request handler at /auth/* and provides
// custom endpoints for tenant switching and user info.
// With the global prefix 'api' set in main.ts, routes become /api/auth/*.
//
// Better Auth manages its own routing for built-in endpoints:
//   POST /api/auth/sign-up/email
//   POST /api/auth/sign-in/email
//   POST /api/auth/sign-out
//   GET  /api/auth/get-session
//   POST /api/auth/organization/*  (organization plugin)
//
// Custom endpoints:
//   POST /api/auth/switch-tenant  — set active organization
//   GET  /api/auth/me              — current user, tenant, permissions

import { auth } from '@clinic-saas/auth';
import {
  Controller,
  All,
  Post,
  Get,
  Req,
  Res,
  Body,
  HttpCode,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { type FastifyReply, type FastifyRequest } from 'fastify';
import type { TenantRequest } from '@clinic-saas/db';

/**
 * DTO for switch-tenant endpoint.
 * Validates that organizationId is a non-empty UUID string.
 * Per MEDIUM-15 — input validation for user-controlled input.
 */
class SwitchTenantDto {
  /** The target organization ID to switch to. Must be a valid UUID. */
  organizationId!: string;

  // NOTE: class-validator is not yet installed. Validation is done
  // manually below. When class-validator is added (Phase 10+), this
  // class should use @IsUUID('4') and @IsNotEmpty() decorators with
  // ValidationPipe.
}

/** Typed response for the /me endpoint. Per MEDIUM-14. */
interface MeResponse {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
  };
  session: {
    id: string;
    activeOrganizationId: string | null;
    expiresAt: Date;
  };
  activeOrganization: { id: string } | null;
  permissions: string[];
}

/** Simple UUID v4 validation regex. */
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Controller('auth')
export class AuthController {
  /**
   * POST /api/auth/switch-tenant
   *
   * Switch the authenticated user's active organization (tenant).
   * Verifies the user is a member of the target organization via
   * Better Auth's member table.
   *
   * Per Roadmap v2.1 §5.7.1 and P0-6 resolution (90-4).
   */
  @Post('switch-tenant')
  @HttpCode(200)
  async switchTenant(
    @Req() req: FastifyRequest & TenantRequest,
    @Res() res: FastifyReply,
    @Body() body: SwitchTenantDto,
  ): Promise<void> {
    if (!body.organizationId || !UUID_V4_RE.test(body.organizationId)) {
      throw new BadRequestException('organizationId must be a valid UUID v4');
    }

    // Build Web API request for Better Auth's setActiveOrganization.
    const protocol = req.protocol;
    const host = req.headers.host ?? 'localhost';
    const url = `${protocol}://${host}/api/auth/organization/set-active`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
    }
    headers.set('content-type', 'application/json');

    const webRequest = new Request(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ organizationId: body.organizationId }),
    });

    const webResponse = await auth.handler(webRequest);

    // Proxy the response.
    res.status(webResponse.status);
    for (const [key, value] of webResponse.headers.entries()) {
      res.header(key, value);
    }
    res.send(await webResponse.text());
  }

  /**
   * GET /api/auth/me
   *
   * Returns the current user, their active tenant (organization),
   * and their effective permissions. The frontend uses this to
   * render role-appropriate UI.
   *
   * Per Roadmap v2.1 §5.7.2.
   */
  @Get('me')
  async getMe(
    @Req() req: FastifyRequest & TenantRequest,
  ): Promise<MeResponse> {
    // Get session from Better Auth.
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    }

    const session = await auth.api.getSession({ headers });

    if (!session) {
      throw new UnauthorizedException('Not authenticated');
    }

    // TODO (Phase 10): Compute effective permissions by walking
    // role_inheritance graph. For now, return the user/org info.
    const result: MeResponse = {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
        image: session.user.image,
      },
      session: {
        id: session.session.id,
        activeOrganizationId: session.session.activeOrganizationId,
        expiresAt: session.session.expiresAt,
      },
      activeOrganization: session.session.activeOrganizationId
        ? { id: session.session.activeOrganizationId }
        : null,
      // TODO (Phase 10): Compute effective permissions by walking
      // the role_inheritance graph per Blueprint §9.2.
      permissions: [],
    };

    return result;
  }

  /**
   * Catch-all handler for Better Auth's built-in routes.
   * Handles sign-up, sign-in, sign-out, get-session, organization/*, etc.
   *
   * Better Auth v1.6+ handler expects a standard Web API Request and
   * returns a Web API Response. We construct a Web Request from the
   * Fastify request properties and proxy the Web Response back.
   *
   * No @HttpCode() decorator — the response status is set explicitly
   * via res.status(webResponse.status) below, preserving Better Auth's
   * own error status codes (e.g., 401 for invalid credentials).
   */
  @All('*')
  async handleAuth(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const protocol = req.protocol;
    const host = req.headers.host ?? 'localhost';
    const url = `${protocol}://${host}${req.url}`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
    }

    const init: RequestInit = {
      method: req.method,
      headers,
    };

    // Attach body for non-GET/HEAD requests that have a parsed body.
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      init.body =
        typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body);
    }

    const webRequest = new Request(url, init);
    const webResponse = await auth.handler(webRequest);

    // Proxy the Web Response back through the Fastify reply.
    res.status(webResponse.status);
    for (const [key, value] of webResponse.headers.entries()) {
      res.header(key, value);
    }
    const responseBody = await webResponse.text();
    res.send(responseBody);
  }
}