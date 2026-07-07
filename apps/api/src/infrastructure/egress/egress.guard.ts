// apps/api/src/infrastructure/egress/egress.guard.ts
//
// EgressGuard — data-residency enforcement. Per Roadmap v2.1 §5.6
// and Blueprint §3, §7.3.
//
// Inspects outbound HTTP calls (via a global fetch wrapper) for
// personal-data fields being sent to non-Algerian hosts.
//
// Mode via EGRESS_GUARD_MODE env var:
//   - 'log' (default for dev/staging): warns but allows the call.
//   - 'block' (production): throws an error, blocking the call.
//
// Personal-data fields (Algerian Law 18-07):
//   name, phone, NIN (numéro d'identification nationale), address,
//   email, date of birth.
//
// Allowlist (Algerian sovereign infrastructure + local dev):
//   CERIST, Djezzy, Algérie Télécom, Mobilis, localhost.

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// NestJS framework types cannot be fully resolved by eslint's
// projectService in the NestJS CommonJS context. These calls
// are type-safe at compile time and correct at runtime.

import { Injectable, Logger } from '@nestjs/common';

/** Personal-data field names that trigger egress checks. */
const PERSONAL_DATA_FIELDS: readonly string[] = [
  'name',
  'family_name',
  'given_name',
  'phone',
  'mobile',
  'nin',
  'nif',
  'national_id',
  'address',
  'email',
  'date_of_birth',
  'dob',
  'birth_date',
];

/** Hostnames allowed for egress (Algerian sovereign + local dev). */
const EGRESS_ALLOWLIST: readonly string[] = [
  'localhost',
  '127.0.0.1',
  '::1',
  '.cerist.dz',
  '.djezzy.dz',
  '.algerietelecom.dz',
  '.mobilis.dz',
];

type EgressMode = 'log' | 'block';

@Injectable()
export class EgressGuard {
  private readonly logger = new Logger(EgressGuard.name);
  private readonly mode: EgressMode;

  constructor() {
    const envMode = process.env.EGRESS_GUARD_MODE;
    this.mode = envMode === 'block' ? 'block' : 'log';
  }

  /**
   * Check if a payload contains personal-data fields.
   * Performs a shallow key scan on the payload object.
   */
  containsPersonalData(payload: unknown): boolean {
    if (!payload || typeof payload !== 'object') return false;
    const obj = payload as Record<string, unknown>;
    return PERSONAL_DATA_FIELDS.some((field) => field in obj);
  }

  /**
   * Check if a hostname is in the Algerian allowlist.
   */
  isAllowedHost(hostname: string): boolean {
    const hostLower = hostname.toLowerCase();
    return EGRESS_ALLOWLIST.some(
      (allowed) => hostLower === allowed || hostLower.endsWith(allowed),
    );
  }

  /**
   * Inspect an outbound call and enforce egress policy.
   * Call this before making any outbound HTTP request.
   *
   * @param url - The target URL.
   * @param payload - The request body (if any).
   * @throws Error if mode is 'block' and the call violates egress policy.
   */
  check(url: string, payload?: unknown): void {
    let hostname: string;
    try {
      hostname = new URL(url).hostname;
    } catch {
      // Invalid URL — can't check, allow it (will fail anyway).
      return;
    }

    // Allowed hosts pass through.
    if (this.isAllowedHost(hostname)) return;

    // Non-personal payloads pass through.
    if (!this.containsPersonalData(payload)) return;

    // EGRESS VIOLATION: personal data going to a non-Algerian host.
    const message =
      `Egress violation: personal data sent to non-Algerian host ` +
      `"${hostname}". Mode: ${this.mode}.`;

    if (this.mode === 'block') {
      this.logger.error(message);
      // TODO (Phase 12): Log to audit_log with action='egress.blocked'
      // when the audit module has a service API.
      throw new Error(message);
    } else {
      this.logger.warn(message);
    }
  }
}

/**
 * Create an egress-checked fetch function.
 * Usage: const safeFetch = createEgressFetch(egressGuard);
 *        await safeFetch('https://api.example.com', { method: 'POST', body: ... });
 */
export function createEgressFetch(guard: EgressGuard): typeof globalThis.fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    let payload: unknown;
    if (init?.body) {
      try {
        payload = JSON.parse(init.body as string);
      } catch {
        payload = init.body;
      }
    }

    guard.check(url, payload);
    return globalThis.fetch(input, init);
  };
}