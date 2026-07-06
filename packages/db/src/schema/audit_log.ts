// packages/db/src/schema/audit_log.ts
//
// Append-only, hash-chained audit log. Per Roadmap v2.1 §4.3.4 and
// Blueprint §9.7.
//
// audit_log IS tenant-scoped. Every audit event belongs to a tenant.
// RLS ensures audit events are only visible within the current tenant
// context (except for super_admin cross-tenant audit queries).
//
// APPEND-ONLY: REVOKE UPDATE, DELETE FROM app_role (Phase 4.5, PR D).
// Only INSERT is allowed. The hash-chain trigger (Phase 4.5, PR D) computes
// hash_curr = SHA-256(prev_hash || canonical_json(this_row)) on every INSERT.
//
// Retention: 6 years minimum (Blueprint §9.7). Retention expiry is handled
// by a documented process (pg_partman or manual), NOT by app-level DELETE.
//
// FHIR compatibility: the schema is FHIR AuditEvent-compatible for future
// export via NationalInteropAdapter. FHIR JSON is NOT stored internally
// (lean tables only, per AGENTS.md Do-NOT #7).

import { pgTable, bigserial, uuid, text, jsonb, timestamp, inet, index } from 'drizzle-orm/pg-core';

import { tenantPolicy } from '../rls';

import { appUser } from './app_user';
import { clinic } from './clinic';

export const auditLog = pgTable(
  'audit_log',
  {
    // bigserial — auto-incrementing 64-bit integer. Suitable for high-volume
    // audit logging (120 encounters/clinic/day × 2 clinics × 365 days × 6 years
    // ≈ 525K rows — well within bigint range).
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    // Timestamp of the audited event (not the INSERT time — should be the
    // same, but explicit for audit correctness).
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    tenantId: uuid('tenant_id').notNull().references(() => clinic.id, { onDelete: 'restrict' }),
    // Nullable for system actions (e.g., cron jobs, migration runs).
    actorUserId: uuid('actor_user_id').references(() => appUser.id, { onDelete: 'set null' }),
    // Denormalized role at time of action (roles can change; audit captures
    // the role the user held WHEN the action was performed).
    actorRole: text('actor_role'),
    // Action string, e.g., "patient.create", "patient.update", "invoice.issue".
    action: text('action').notNull(),
    // Entity type, e.g., "patient", "encounter", "invoice".
    entityType: text('entity_type').notNull(),
    // Entity ID (text to support non-UUID ids in future entities).
    entityId: text('entity_id'),
    // State before the mutation (NULL for CREATE).
    beforeJsonb: jsonb('before_jsonb'),
    // State after the mutation (NULL for DELETE — but we don't hard-DELETE
    // clinical tables, so this is usually populated for soft-deletes).
    afterJsonb: jsonb('after_jsonb'),
    // Client IP (inet type supports IPv4 and IPv6).
    ipAddress: inet('ip_address'),
    // Client user agent.
    userAgent: text('user_agent'),
    // Correlation ID for distributed tracing.
    requestId: text('request_id'),
    // "success" | "failure" — whether the audited action succeeded.
    outcome: text('outcome').notNull().default('success'),
    // Hash chain: hash_prev = hash_curr of the previous row (by id order).
    // NULL for the first row.
    // JC-18-4: stored as text (hex-encoded) instead of bytea because
    // Drizzle 0.40.1 does not have a built-in bytea column type. The hash
    // is 32 bytes (SHA-256) = 64 hex characters. Text is simpler to debug
    // in psql and works identically for the hash-chain computation. A
    // future Drizzle version with bytea support can migrate this column.
    hashPrev: text('hash_prev'),
    // Hash of this row = SHA-256(hash_prev || canonical_json(this_row)).
    // Computed by the audit_log_hash_chain trigger (Phase 4.5, PR D).
    hashCurr: text('hash_curr'),
  },
  (table) => [
    tenantPolicy('audit_log'),
    // Tenant + timestamp index for the audit log UI (list events for a
    // tenant, newest first).
    index('audit_log_tenant_timestamp_idx').on(table.tenantId, table.timestamp),
    // Actor index for "show me everything user X did".
    index('audit_log_actor_idx').on(table.actorUserId),
    // Entity index for "show me the audit history of entity Y".
    index('audit_log_entity_idx').on(table.entityType, table.entityId),
    // No deleted_at — audit_log is append-only. No soft delete.
    // No unique constraint — bigserial id is the PK.
  ],
);
auditLog.enableRLS();

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
