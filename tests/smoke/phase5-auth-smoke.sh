#!/usr/bin/env bash
# tests/smoke/phase5-auth-smoke.sh
#
# Phase 5 auth smoke test — boots the NestJS API via tsx (esbuild) and
# exercises the Better Auth end-to-end flow:
#
#   health → sign-up → get-session → /me (no auth) → /me (auth) →
#   insert org+member → switch-tenant → /me (active org) → sign-out →
#   get-session=null
#
# Why this exists: PR #33 (Phase 5) landed with two classes of bug that
# CI couldn't catch because no job booted the NestJS DI container:
#   1. A stale Drizzle migration missing `organization.clinic_id`.
#   2. Three NestJS DI bugs (exported-but-not-provided modules + missing
#      `@Inject(Token)` decorators — esbuild doesn't emit
#      `emitDecoratorMetadata`, so implicit constructor injection was
#      `undefined` at runtime).
#
# Both classes are caught by this script in ~15 seconds. See WORKLOG.md
# Task 23 for the full root-cause analysis and Task 24 for the CI wiring.
#
# ─── Usage ─────────────────────────────────────────────────────────────
# Local (against Neon staging — requires .env.staging at repo root):
#   set -a && . ./.env.staging && set +a
#   bash tests/smoke/phase5-auth-smoke.sh
#
# Local (against docker-compose Postgres — requires `pnpm db:migrate` +
# `pnpm db:seed` to have run first):
#   export DATABASE_URL=postgresql://app_role:dev_password@localhost:5432/clinic_dev
#   export MIGRATION_DATABASE_URL=postgresql://ops_superuser:dev_ops_password@localhost:5432/clinic_dev
#   export BETTER_AUTH_URL=http://localhost:3001
#   export BETTER_AUTH_SECRET=$(openssl rand -base64 32)
#   bash tests/smoke/phase5-auth-smoke.sh
#
# CI (in .github/workflows/ci.yml `smoke` job):
#   The job sets the env vars + boots a Postgres service container, then
#   invokes this script. The script is responsible for starting the API,
#   running assertions, and cleaning up.
#
# ─── Environment ───────────────────────────────────────────────────────
# Required:
#   DATABASE_URL              — app_role connection string (NOBYPASSRLS).
#   MIGRATION_DATABASE_URL    — ops_superuser / neondb_owner connection
#                               string (BYPASSRLS) — used for smoke-test
#                               row cleanup (hard DELETE on global auth
#                               tables; acceptable per AGENTS.md).
#   BETTER_AUTH_URL           — typically http://localhost:3001.
#   BETTER_AUTH_SECRET        — any ≥32-char string (openssl rand -base64 32).
#
# Optional:
#   SMOKE_API_PORT            — default 3001. Override if 3001 is in use.
#   SMOKE_API_BOOT_BUDGET_SEC — default 30. How long to wait for API to
#                               respond 200 on GET / before failing.
#   SMOKE_API_LOG             — default /tmp/clinic-saas-smoke-api.log.
#                               API stdout+stderr is written here.
#   SMOKE_COOKIE_JAR          — default /tmp/clinic-saas-smoke-cookies.txt.
#
# ─── Exit codes ───────────────────────────────────────────────────────
#   0  all assertions passed + cleanup succeeded.
#   1  one or more assertions failed, OR the API failed to boot, OR
#      cleanup failed (cleanup failure is loud — we never want smoke-test
#      rows lingering in the DB).
#
# ─── Hard constraints (AGENTS.md) ─────────────────────────────────────
#   - Parameterized SQL only (psql -v + $1 in postgresql; no
#     string-interpolated values into queries).
#   - No PII in logs (we assert this at the end: the smoke-test email
#     and user_id must NOT appear in API stdout/stderr).
#   - Soft deletes — N/A. Auth tables (user, session, account,
#     organization, member) are global and managed by Better Auth.
#     They have no `deleted_at` column. Hard DELETE is acceptable for
#     smoke-test cleanup per AGENTS.md "Soft Deletes — Mandatory"
#     (which scopes the soft-delete rule to "tenant-scoped or clinical
#     tables" — auth tables are neither).
#   - The smoke test creates real rows in the DB. Cleanup at the end
#     (hard DELETE on global auth tables — acceptable, documented above).

set -euo pipefail

# ─── Color helpers (disabled if not a TTY) ────────────────────────────
if [ -t 1 ]; then
  GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; YELLOW=$'\033[0;33m'; RESET=$'\033[0m'
else
  GREEN=''; RED=''; YELLOW=''; RESET=''
fi

log()  { printf '%s[smoke]%s %s\n'  "$YELLOW" "$RESET" "$*"; }
ok()   { printf '%s[ PASS ]%s %s\n' "$GREEN"  "$RESET" "$*"; }
fail() { printf '%s[ FAIL ]%s %s\n' "$RED"    "$RESET" "$*" >&2; }

# ─── Track created rows for cleanup ───────────────────────────────────
# Set by the sign-up + org-insert steps; consumed by cleanup().
SMOKE_USER_ID=''
SMOKE_ORG_ID='00000000-0000-4000-8000-000000000001'  # valid UUID v4
SMOKE_EMAIL="smoke-$(date +%s)-$$@clinic-saas-smoke.test"
SMOKE_PASSWORD='Smoke-Test-Password-123!'
API_PID=''
API_LOG="${SMOKE_API_LOG:-/tmp/clinic-saas-smoke-api.log}"
COOKIE_JAR="${SMOKE_COOKIE_JAR:-/tmp/clinic-saas-smoke-cookies.txt}"
API_PORT="${SMOKE_API_PORT:-3001}"
API_BOOT_BUDGET_SEC="${SMOKE_API_BOOT_BUDGET_SEC:-30}"

# ─── Cleanup function — runs on EXIT, INT, TERM ───────────────────────
cleanup() {
  local exit_code=$?
  trap '' EXIT INT TERM

  if [ -n "$API_PID" ]; then
    log "Stopping API (pid $API_PID)..."
    kill -9 "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi

  if [ -n "${SMOKE_USER_ID:-}" ] && [ -n "${MIGRATION_DATABASE_URL:-}" ]; then
    log "Cleaning up smoke-test rows (hard DELETE on global auth tables)..."
    # Parameterized via psql -v + heredoc. Hard DELETE is acceptable per
    # AGENTS.md because auth tables are global (not tenant-scoped) and have
    # no deleted_at column. Order: member → session → account →
    # verification → user → organization (respects FK constraints).
    # NOTE: psql -c does NOT support :'var' interpolation; only -f and
    # heredocs (stdin) do. So we use a heredoc.
    if ! psql "$MIGRATION_DATABASE_URL" \
        -v ON_ERROR_STOP=0 \
        -v org_id="$SMOKE_ORG_ID" \
        -v user_id="$SMOKE_USER_ID" \
        >/dev/null 2>&1 <<SQL; then
DELETE FROM member       WHERE organization_id = :'org_id';
DELETE FROM session      WHERE user_id = :'user_id';
DELETE FROM account      WHERE user_id = :'user_id';
DELETE FROM verification WHERE user_id = :'user_id';
DELETE FROM "user"       WHERE id = :'user_id';
DELETE FROM organization WHERE id = :'org_id';
SQL
      fail "Cleanup failed — smoke-test rows may still be in the DB. Inspect:"
      fail "  psql \"\$MIGRATION_DATABASE_URL\" -c \"SELECT id,email FROM \\\"user\\\" WHERE email LIKE '%clinic-saas-smoke.test%';\""
      exit_code=1
    else
      ok "Cleanup complete"
    fi
  fi

  rm -f "$COOKIE_JAR" 2>/dev/null || true
  exit "$exit_code"
}
trap cleanup EXIT INT TERM

# ─── Pre-flight env checks ────────────────────────────────────────────
for var in DATABASE_URL MIGRATION_DATABASE_URL BETTER_AUTH_URL BETTER_AUTH_SECRET; do
  if [ -z "${!var:-}" ]; then
    fail "Required env var $var is not set. See usage comment at top of script."
    exit 1
  fi
done

# Resolve repo root from script location (works in CI + local).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
API_DIR="$REPO_ROOT/apps/api"

log "Repo root: $REPO_ROOT"
log "Smoke email: $SMOKE_EMAIL"
log "Smoke org ID: $SMOKE_ORG_ID (valid UUID v4)"
log "API log: $API_LOG"

# ─── Step 0: locate tsx loader ────────────────────────────────────────
# The workspace packages import `.ts` source (no built dist/), so we MUST
# run the API via tsx. tsx 4.23.0 ships a loader at the path below.
# pnpm's content-addressable store layout:
#   node_modules/.pnpm/tsx@<version>/node_modules/tsx/dist/loader.mjs
TSX_LOADER=$(find "$REPO_ROOT/node_modules/.pnpm" \
  -path '*/tsx@*/node_modules/tsx/dist/loader.mjs' \
  -type f 2>/dev/null | head -1 || true)
if [ -z "$TSX_LOADER" ]; then
  fail "Could not find tsx loader under node_modules/.pnpm. Did pnpm install run?"
  exit 1
fi
log "Found tsx loader: $TSX_LOADER"

# ─── Step 1: resolve a clinic.id to FK against ───────────────────────
# The seed (packages/db/src/seed.ts) inserts 2 clinics with fixed UUIDs.
# We don't hardcode the UUID here — we fetch one at runtime so the
# smoke test is resilient to env-specific seed state.
CLINIC_ID=$(psql "$MIGRATION_DATABASE_URL" -tA -c \
  "SELECT id FROM clinic ORDER BY created_at LIMIT 1;" 2>/dev/null || true)
if [ -z "$CLINIC_ID" ]; then
  fail "No clinic rows found in DB. Run `pnpm --filter @clinic-saas/db db:seed` first."
  exit 1
fi
log "Resolved clinic.id for org FK: $CLINIC_ID"

# ─── Step 2: start the API via tsx ────────────────────────────────────
# Run from apps/api/ so tsx picks up apps/api/tsconfig.json (which has
# experimentalDecorators: true + the NestJS-friendly compiler options).
# node --import <loader> loads the tsx ESMLoader hook BEFORE app code
# imports workspace packages. Without this, `import { AppModule } from
# './app.module.js'` fails because the .ts source isn't resolvable.
log "Starting API on port $API_PORT (boot budget: ${API_BOOT_BUDGET_SEC}s)..."
: > "$API_LOG"
# Run node directly (no subshell) so $! captures the actual node PID.
# We pass the cwd via `cd` in a subshell would orphan the process; instead
# we use `node --cwd` (not supported) — so we use a here-doc to set cwd
# via process substitution OR just call node with an absolute path to
# main.ts and rely on tsx to resolve the tsconfig from main.ts's dir.
# Simpler: use `bash -c 'cd ... && exec node ...' &` so $! is the bash
# process that exec's into node (same effective PID after exec).
PORT="$API_PORT" \
DATABASE_URL="$DATABASE_URL" \
BETTER_AUTH_URL="$BETTER_AUTH_URL" \
BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
NODE_ENV=development \
bash -c "cd '$API_DIR' && exec node --import 'file://${TSX_LOADER}' src/main.ts" \
  >>"$API_LOG" 2>&1 &
API_PID=$!
log "API pid: $API_PID"

# Poll GET / until 200 (up to API_BOOT_BUDGET_SEC).
boot_deadline=$(( $(date +%s) + API_BOOT_BUDGET_SEC ))
booted=false
while [ "$(date +%s)" -lt "$boot_deadline" ]; do
  if ! kill -0 "$API_PID" 2>/dev/null; then
    fail "API process exited before boot. Last 50 lines of log:"
    tail -n 50 "$API_LOG" >&2
    exit 1
  fi
  if curl -sf -o /dev/null "http://localhost:${API_PORT}/" 2>/dev/null; then
    booted=true
    break
  fi
  sleep 1
done
if [ "$booted" != "true" ]; then
  fail "API did not respond 200 on GET / within ${API_BOOT_BUDGET_SEC}s. Last 50 lines of log:"
  tail -n 50 "$API_LOG" >&2
  exit 1
fi
ok "API booted (GET / 200)"

# ─── Helper: assert HTTP status ───────────────────────────────────────
# Usage: assert_status <expected> <actual> <description>
assert_status() {
  local expected="$1" actual="$2" desc="$3"
  if [ "$actual" = "$expected" ]; then
    ok "$desc (HTTP $actual)"
  else
    fail "$desc — expected HTTP $expected, got $actual"
    fail "  Last 20 lines of API log:"
    tail -n 20 "$API_LOG" >&2 || true
    exit 1
  fi
}

# ─── Step 3: sign up a new user ───────────────────────────────────────
# Better Auth's CSRF protection requires an Origin header on POSTs
# (otherwise: 403 MISSING_OR_NULL_ORIGIN). The Origin must match
# BETTER_AUTH_URL.
log "POST /api/auth/sign-up/email ($SMOKE_EMAIL)"
# CRITICAL: -c "$COOKIE_JAR" persists the Set-Cookie response header
# (better-auth.session_token) to the jar. Without this, every subsequent
# request that depends on the session would 401. We also pass -b in case
# the jar already exists from a previous step (it doesn't, but -b -c is
# the safe pattern).
SIGNUP_STATUS=$(curl -s -o /tmp/clinic-saas-smoke-signup.json -w '%{http_code}' \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "http://localhost:${API_PORT}/api/auth/sign-up/email" \
  -H 'content-type: application/json' \
  -H "origin: ${BETTER_AUTH_URL}" \
  -d "{\"name\":\"Smoke Test\",\"email\":\"${SMOKE_EMAIL}\",\"password\":\"${SMOKE_PASSWORD}\"}")
assert_status 200 "$SIGNUP_STATUS" "sign-up"
rm -f /tmp/clinic-saas-smoke-signup.json

# ─── Step 4: get-session (with cookie) ───────────────────────────────
# Better Auth returns 200 with `null` body when no session, 200 with the
# session JSON when there is one. We assert the body is non-null — this
# catches the case where the cookie wasn't actually sent (e.g., sign-up
# step didn't persist Set-Cookie).
log "GET /api/auth/get-session (with cookie)"
SESSION_STATUS=$(curl -s -o /tmp/clinic-saas-smoke-session.json -w '%{http_code}' \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  "http://localhost:${API_PORT}/api/auth/get-session")
assert_status 200 "$SESSION_STATUS" "get-session (with cookie)"
SESSION_BODY=$(cat /tmp/clinic-saas-smoke-session.json)
if [ "$SESSION_BODY" = "null" ] || [ -z "$SESSION_BODY" ]; then
  fail "get-session returned null — session cookie was not sent. Cookie jar contents:"
  cat "$COOKIE_JAR" >&2 || true
  exit 1
fi
ok "Session cookie is valid (get-session returned non-null session)"
rm -f /tmp/clinic-saas-smoke-session.json

# ─── Step 5: /me WITHOUT cookie — expect 401 ─────────────────────────
log "GET /api/auth/me (no cookie → 401)"
ME_NO_AUTH_STATUS=$(curl -s -o /dev/null -w '%{http_code}' \
  "http://localhost:${API_PORT}/api/auth/me")
assert_status 401 "$ME_NO_AUTH_STATUS" "/me without auth"

# ─── Step 6: /me WITH cookie — expect 200, permissions=[], activeOrg=null
log "GET /api/auth/me (with cookie → 200)"
ME_STATUS=$(curl -s -o /tmp/clinic-saas-smoke-me.json -w '%{http_code}' \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  "http://localhost:${API_PORT}/api/auth/me")
assert_status 200 "$ME_STATUS" "/me with auth"

# Extract user.id via python3 (NOT a greedy sed regex — sed picks
# session.id by mistake because both objects have an "id" field).
SMOKE_USER_ID=$(python3 -c '
import json, sys
with open("/tmp/clinic-saas-smoke-me.json") as f:
    d = json.load(f)
print(d["user"]["id"])
' 2>/dev/null || true)
if [ -z "$SMOKE_USER_ID" ]; then
  fail "Could not extract user.id from /me response. Response body:"
  cat /tmp/clinic-saas-smoke-me.json >&2
  exit 1
fi
log "Extracted user.id: $SMOKE_USER_ID"

# Validate permissions: [] and activeOrganization: null.
PERMS=$(python3 -c 'import json; print(json.load(open("/tmp/clinic-saas-smoke-me.json"))["permissions"])' 2>/dev/null || echo '?')
ACTIVE_ORG=$(python3 -c 'import json; print(json.load(open("/tmp/clinic-saas-smoke-me.json"))["activeOrganization"])' 2>/dev/null || echo '?')
if [ "$PERMS" = "[]" ] && [ "$ACTIVE_ORG" = "None" ]; then
  ok "/me shape correct (permissions=[], activeOrganization=null)"
else
  fail "/me shape wrong — permissions=$PERMS activeOrganization=$ACTIVE_ORG"
  cat /tmp/clinic-saas-smoke-me.json >&2
  exit 1
fi
rm -f /tmp/clinic-saas-smoke-me.json

# ─── Step 7: insert organization + member rows ───────────────────────
# Better Auth's organization plugin has allowUserToCreateOrganization:false,
# so we can't POST /api/auth/organization to create the org. Instead we
# insert directly via SQL (as neondb_owner / ops_superuser).
#
# The switch-tenant DTO validates organizationId as @IsUUID('4') — so
# we MUST use a valid UUID v4, not a string like 'org-smoke-1'.
#
# The organization.clinic_id FK requires a valid clinic.id (resolved
# in Step 1). The TenantInterceptor at tenant.interceptor.ts:117 does
# `SELECT clinic_id FROM organization WHERE id = ${tenantId}` and will
# throw if clinic_id is null.
log "Inserting smoke-test organization + member rows..."
# NOTE: psql -c does NOT support :'var' interpolation; heredoc does.
# The organization.id and member.id columns are `text PRIMARY KEY NOT NULL`
# with a JS-side default ($defaultFn(crypto.randomUUID)) — that default
# only fires via the Drizzle ORM, not raw SQL. So we must provide ids.
# We use gen_random_uuid() (pgcrypto extension, enabled by 002_audit_log_immutable.sql)
# for member.id; organization.id is a fixed UUID v4 so the cleanup knows
# what to delete.
psql "$MIGRATION_DATABASE_URL" \
  -v ON_ERROR_STOP=1 \
  -v org_id="$SMOKE_ORG_ID" \
  -v user_id="$SMOKE_USER_ID" \
  -v clinic_id="$CLINIC_ID" \
  >/dev/null <<SQL
INSERT INTO organization (id, name, slug, clinic_id)
  VALUES (:'org_id', 'Smoke Test Org', 'smoke-test-org', :'clinic_id')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO member (id, organization_id, user_id, role)
  VALUES (gen_random_uuid(), :'org_id', :'user_id', 'owner')
  ON CONFLICT (organization_id, user_id) DO NOTHING;
SQL
ok "Organization + member inserted"

# ─── Step 8: switch-tenant ───────────────────────────────────────────
# POST /api/auth/switch-tenant with {organizationId: <UUID v4>} + Origin.
log "POST /api/auth/switch-tenant"
SWITCH_STATUS=$(curl -s -o /tmp/clinic-saas-smoke-switch.json -w '%{http_code}' \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "http://localhost:${API_PORT}/api/auth/switch-tenant" \
  -H 'content-type: application/json' \
  -H "origin: ${BETTER_AUTH_URL}" \
  -d "{\"organizationId\":\"${SMOKE_ORG_ID}\"}")
assert_status 200 "$SWITCH_STATUS" "switch-tenant"
rm -f /tmp/clinic-saas-smoke-switch.json

# ─── Step 9: /me again — expect activeOrganization.id set ────────────
log "GET /api/auth/me (after switch-tenant)"
ME2_STATUS=$(curl -s -o /tmp/clinic-saas-smoke-me2.json -w '%{http_code}' \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  "http://localhost:${API_PORT}/api/auth/me")
assert_status 200 "$ME2_STATUS" "/me after switch-tenant"

ME2_ACTIVE_ORG_ID=$(python3 -c '
import json
with open("/tmp/clinic-saas-smoke-me2.json") as f:
    d = json.load(f)
ao = d.get("activeOrganization")
print(ao["id"] if ao else "")
' 2>/dev/null || true)
if [ "$ME2_ACTIVE_ORG_ID" = "$SMOKE_ORG_ID" ]; then
  ok "/me activeOrganization.id = $SMOKE_ORG_ID"
else
  fail "/me activeOrganization.id mismatch — expected $SMOKE_ORG_ID, got '$ME2_ACTIVE_ORG_ID'"
  cat /tmp/clinic-saas-smoke-me2.json >&2
  exit 1
fi
rm -f /tmp/clinic-saas-smoke-me2.json

# ─── Step 10: sign-out ───────────────────────────────────────────────
# CRITICAL: use -c (write jar) in addition to -b (read jar) so the
# cleared cookie is persisted — otherwise the next get-session sends
# the stale cookie.
log "POST /api/auth/sign-out"
SIGNOUT_STATUS=$(curl -s -o /dev/null -w '%{http_code}' \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "http://localhost:${API_PORT}/api/auth/sign-out" \
  -H "origin: ${BETTER_AUTH_URL}")
assert_status 200 "$SIGNOUT_STATUS" "sign-out"

# ─── Step 11: get-session after sign-out — expect 200 null ──────────
log "GET /api/auth/get-session (after sign-out → null)"
SESSION_AFTER_STATUS=$(curl -s -o /tmp/clinic-saas-smoke-session-after.json -w '%{http_code}' \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  "http://localhost:${API_PORT}/api/auth/get-session")
assert_status 200 "$SESSION_AFTER_STATUS" "get-session after sign-out"
SESSION_AFTER_BODY=$(cat /tmp/clinic-saas-smoke-session-after.json)
if [ "$SESSION_AFTER_BODY" = "null" ]; then
  ok "Session cleared (get-session → null)"
else
  fail "Session not cleared — get-session returned non-null:"
  echo "$SESSION_AFTER_BODY" >&2
  exit 1
fi
rm -f /tmp/clinic-saas-smoke-session-after.json /tmp/clinic-saas-smoke-session.json

# ─── Step 12: assert no PII in API logs ──────────────────────────────
# AGENTS.md hard constraint: no PII (email, user_id) in logs. We grep
# the API stdout/stderr for the smoke-test email + user_id — both must
# be absent. (The API uses NestJS's default logger which logs request
# URLs but not bodies. If a future change starts logging bodies, this
# assertion will catch it.)
log "Asserting no PII in API logs..."
if grep -F "$SMOKE_EMAIL" "$API_LOG" >/dev/null 2>&1; then
  fail "PII leak: smoke-test email appears in API log"
  grep -nF "$SMOKE_EMAIL" "$API_LOG" >&2 || true
  exit 1
fi
if grep -F "$SMOKE_USER_ID" "$API_LOG" >/dev/null 2>&1; then
  fail "PII leak: smoke-test user_id appears in API log"
  grep -nF "$SMOKE_USER_ID" "$API_LOG" >&2 || true
  exit 1
fi
ok "No PII in API logs"

# ─── Success ─────────────────────────────────────────────────────────
ok "All Phase 5 auth smoke assertions passed"
log "(Cleanup runs via trap on exit)"
