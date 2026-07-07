// packages/db/src/schema/auth.ts
//
// Better Auth schema tables. Per Roadmap v2.1 §5.1.2 and ADR-004.
//
// These tables are managed by Better Auth (sign-up, sign-in, sessions,
// organization membership). They are NOT tenant-scoped — auth tables are
// global because the login flow must find a user by email WITHOUT a tenant
// context (P0-6 resolution, 90-4).
//
// The Drizzle adapter for Better Auth reads these table definitions.
// The adapter schema key names MUST match what Better Auth expects:
//   user, session, account, verification, organization, member, invitation.

import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  unique,
} from 'drizzle-orm/pg-core';

export const authUser = pgTable('user', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('user_email_idx').on(table.email),
]);

export const authSession = pgTable('session', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => authUser.id, { onDelete: 'cascade' }),
  activeOrganizationId: text('active_organization_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('session_user_id_idx').on(table.userId),
  index('session_token_idx').on(table.token),
]);

export const authAccount = pgTable('account', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => authUser.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('account_user_id_idx').on(table.userId),
]);

export const authVerification = pgTable('verification', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const authOrganization = pgTable('organization', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  metadata: text('metadata'), // JSON string
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('organization_slug_idx').on(table.slug),
]);

export const authMember = pgTable('member', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => authOrganization.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => authUser.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('member_organization_id_idx').on(table.organizationId),
  index('member_user_id_idx').on(table.userId),
  unique('member_org_user_unique').on(table.organizationId, table.userId),
]);

export const authInvitation = pgTable('invitation', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => authOrganization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull(),
  status: text('status').notNull().default('pending'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  inviterId: text('inviter_id').notNull().references(() => authUser.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('invitation_organization_id_idx').on(table.organizationId),
  index('invitation_email_idx').on(table.email),
]);