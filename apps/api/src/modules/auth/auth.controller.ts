// apps/api/src/modules/auth/auth.controller.ts
//
// Mounts Better Auth's request handler at /auth/*.
// With the global prefix 'api' set in main.ts, this becomes /api/auth/*.
//
// Better Auth manages its own routing within this path:
//   POST /api/auth/sign-up/email
//   POST /api/auth/sign-in/email
//   POST /api/auth/sign-out
//   GET  /api/auth/get-session
//   POST /api/auth/organization/*  (organization plugin)
//   etc.

import { auth } from '@clinic-saas/auth';
import {
  Controller,
  All,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import { type FastifyReply, type FastifyRequest } from 'fastify';

@Controller('auth')
export class AuthController {
  @All('*')
  @HttpCode(200)
  async handleAuth(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ): Promise<void> {
    // Better Auth v1.6+ handler expects a standard Web API Request and
    // returns a Web API Response. We construct a Web Request from the
    // Fastify request properties and then proxy the Web Response back
    // through the Fastify reply.
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