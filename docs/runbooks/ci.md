# Runbook: CI

> **Purpose:** operational reference for the clinic-saas CI workflow. What
> runs, how to run it locally, how to debug failures, the Postgres service
> container setup, the gitleaks policy, and the **ruleset relax/restore
> payloads** the operator (or AI agent) uses for the solo-operator merge
> workaround (Roadmap §2.7.3) — updated to include the `required_status_check`
> rule added in PR #28.

> **Audience:** the operator (solo) + any AI agent session that needs to
> merge a PR. The relax/restore payloads in §5 are the authoritative
> reference — copy them verbatim.

> **Reference ADRs:** [ADR-010](../adr/ADR-010.md) (manual AI review session),
> [ADR-012](../adr/ADR-012.md) (CI is the machine gate),
> [ADR-011](../adr/ADR-011.md) (secrets management — Tier 2 for CI secrets).

## 1. What CI runs

Two workflows live under `.github/workflows/`:

### `.github/workflows/ci.yml` — the main CI

Triggers: `pull_request` (to `main`) and `push` (to `main`). Concurrency
group cancels superseded runs on the same ref.

| Job            | What it does                                                            | DB? | Timeout |
|----------------|-------------------------------------------------------------------------|-----|---------|
| `lint`         | `pnpm lint` (eslint flat config across all 8 workspaces)                | No  | 5 min   |
| `typecheck`    | `pnpm typecheck` (`tsc --noEmit` across all 8 workspaces)               | No  | 5 min   |
| `test-scripts` | `bash tests/test-setup-workstation.sh` (22 bash tests for Phase 1 fix)  | No  | 5 min   |
| `integration`  | Postgres 17 service container + drizzle migrations + FORCE RLS + audit immutability + 19 Vitest tests | Yes | 10 min  |

All third-party actions are pinned to commit SHAs (not tags) per the
critical review §9.1 30-1:

- `actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0` (v7.0.0)
- `actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e` (v6.4.0)
- `pnpm/action-setup@0ebf47130e4866e96fce0953f49152a61190b271` (v6.0.9)

Node.js 24.18.0 + pnpm 11.10.0 (matches `package.json` `engines` and
`packageManager`).

### `.github/workflows/gitleaks.yml` — secret scanning

Triggers: same as CI. **Downloads the MIT-licensed gitleaks binary (v8.30.1)
directly** and runs it against the PR diff (or the latest commit on push).
No third-party action wrapper, no `GITLEAKS_LICENSE` required.

Why not `gitleaks/gitleaks-action`? The gitleaks-action wrapper (v2.0.0+)
requires a `GITLEAKS_LICENSE` secret for repos that belong to a GitHub
Organization (per the README at
<https://github.com/gitleaks/gitleaks-action>). This repo belongs to the
`Thika-Management-Dz` org, so the action would fail without a license.
The license is free but requires a Google-form signup at gitleaks.io —
operator action that can't be done by an AI agent. Running the gitleaks
binary directly is more transparent, has no future licensing risk, and
uses the same default ruleset the action uses.

The gitleaks binary is pinned to v8.30.1 with SHA256 verification
(`551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb`,
from the official checksums.txt at
<https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_checksums.txt>).
Bumping the version should be a deliberate choice — update both the
`GITLEAKS_VERSION` env var AND the `GITLEAKS_SHA256` in the workflow in
the same PR.

A finding fails the `gitleaks` check, which is a `required_status_check`
in the main-protection ruleset (ID 18567129) after PR #28. See §5 for the
relax/restore payloads.

## 2. How to run CI locally

The CI workflow is designed to mirror what you can run locally. To
reproduce the full CI pipeline on your workstation:

```bash
# Install dependencies (matches CI's --frozen-lockfile)
pnpm install --frozen-lockfile

# Job 1: lint
pnpm lint

# Job 2: typecheck
pnpm typecheck

# Job 3: test-scripts (bash)
bash tests/test-setup-workstation.sh

# Job 4: integration — requires a running Postgres with the dev schema.
# Start one with docker compose:
docker compose up -d postgres
# Wait for healthy:
docker compose ps   # postgres should show "healthy"

# Apply the same setup CI does (001_roles.sql runs automatically on first
# init via docker-entrypoint-initdb.d — the .sh wrapper passes passwords
# via psql :var substitution; see docker-compose.yml):
pnpm --filter @clinic-saas/db db:migrate
docker compose exec postgres psql -U postgres -d clinic_dev \
  -v ON_ERROR_STOP=1 -f /docker-entrypoint-initdb.d/../sql/003_force_rls.sql
# (Or, equivalently:)
PGPASSWORD=dev_postgres_password psql -h localhost -U postgres -d clinic_dev \
  -v ON_ERROR_STOP=1 \
  -v app_role_password='dev_password' \
  -v ops_password='dev_ops_password' \
  -f packages/db/sql/001_roles.sql
PGPASSWORD=dev_postgres_password psql -h localhost -U postgres -d clinic_dev \
  -v ON_ERROR_STOP=1 -f packages/db/sql/003_force_rls.sql
PGPASSWORD=dev_postgres_password psql -h localhost -U postgres -d clinic_dev \
  -v ON_ERROR_STOP=1 -f packages/db/sql/002_audit_log_immutable.sql

# Set DATABASE_URL + MIGRATION_DATABASE_URL (matches CI env: section):
export DATABASE_URL=postgresql://app_role:dev_password@localhost:5432/clinic_dev
export MIGRATION_DATABASE_URL=postgresql://ops_superuser:dev_ops_password@localhost:5432/clinic_dev

# Run the integration tests:
pnpm --filter @clinic-saas/db test
```

### Running integration tests against Neon staging instead

If you don't want to run Docker locally, you can run the integration tests
against the Neon staging DB instead (per ADR-011 Tier 1):

```bash
cp .env.staging.example .env.staging
chmod 600 .env.staging
$EDITOR .env.staging   # fill in app_role + neondb_owner passwords

set -a && . ./.env.staging && set +a
pnpm --filter @clinic-saas/db test
```

CI itself always uses the docker Postgres service container (not Neon) —
this keeps CI hermetic and free of network dependencies.

## 3. The Postgres service container setup

The `integration` job uses a `services.postgres` block with:

- `image: postgres:17-alpine` (matches `docker-compose.yml`)
- `POSTGRES_USER: postgres` (NOT `app_role` — see JC-18-1 in
  `docker-compose.yml` for the rationale)
- `POSTGRES_PASSWORD: dev_postgres_password` (the dev-only default)
- `POSTGRES_DB: clinic_dev`
- Health check via `pg_isready -U postgres -d clinic_dev` with 5s interval,
  5s timeout, 10 retries (50s startup budget — generous enough for cold
  starts).

GitHub Actions service containers do not support the `volumes:` key, so
`001_roles.sql` cannot be mounted as a docker-entrypoint-initdb.d init
script. Instead, the workflow:

1. Installs `postgresql-client` on the runner (`apt-get install -y -qq
   postgresql-client`, ~5s).
2. Applies `001_roles.sql` via `psql -h localhost -U postgres -d clinic_dev
   -f packages/db/sql/001_roles.sql` (creates `app_role` + `ops_superuser`
   with the dev defaults).
3. Runs `pnpm --filter @clinic-saas/db db:migrate` (drizzle-kit migrations,
   connects via `MIGRATION_DATABASE_URL` as `ops_superuser`).
4. Applies `003_force_rls.sql` (FORCE RLS — Drizzle 0.40.1 has no
   `forceRLS()` API, JC-18-3).
5. Applies `002_audit_log_immutable.sql` (REVOKE UPDATE/DELETE on audit_log
   + pgcrypto extension + `compute_audit_hash_curr()` trigger function +
   BEFORE INSERT trigger).
6. Runs `pnpm --filter @clinic-saas/db test` (the 19 Vitest tests: 13 RLS
   + 6 audit_log).

The `DATABASE_URL` + `MIGRATION_DATABASE_URL` env vars are set at the job
level (not per-step) so they're available to both `pnpm db:migrate` and
`pnpm test`.

### Troubleshooting the service container

- **`psql: connection refused`** — the postgres container hasn't started
  yet. The health check should prevent this, but if it happens, add
  `sleep 5` between the install step and the first psql call.
- **`psql: FATAL: password authentication failed for user "postgres"`** —
  the `POSTGRES_PASSWORD` env var in the `services:` block doesn't match
  the `PGPASSWORD` env in the step. They must both be
  `dev_postgres_password`.
- **`role app_role does not exist`** — `001_roles.sql` didn't run. Check
  that the file path is correct (`packages/db/sql/001_roles.sql`) and that
  the `psql -f` step ran with `-v ON_ERROR_STOP=1` (it would have failed
  the job if 001_roles.sql had an error). Note: 001_roles.sql now uses psql
  `:var` substitution — the CI step must pass `-v app_role_password=...`
  and `-v ops_password=...` (see the integration job step).
- **`relation "clinic" does not exist`** — migrations didn't run. Check
  that `pnpm --filter @clinic-saas/db db:migrate` succeeded and that
  `MIGRATION_DATABASE_URL` is set.
- **`permission denied for table audit_log`** — `002_audit_log_immutable.sql`
  REVOKE was applied before GRANT, or the GRANT in `003_force_rls.sql`
  didn't run. Order matters: 001_roles → migrate → 003_force_rls →
  002_audit_log_immutable.

## 4. The gitleaks policy

Two layers of secret scanning:

### Local: `.pre-commit-config.yaml`

Uses the `gitleaks-docker` pre-commit hook (requires Docker running). Install
with:

```bash
pip install pre-commit        # or: brew install pre-commit
pre-commit install            # wires .git/hooks/pre-commit
pre-commit run --all-files    # one-shot run on the whole repo
```

The hook catches secrets BEFORE they land in git history (where they're
expensive to remove — see `SECURITY.md` "Secret hygiene").

### CI: `.github/workflows/gitleaks.yml`

Runs the **MIT-licensed gitleaks binary (v8.30.1) directly** on every
PR/push. The binary is downloaded with SHA256 verification in the workflow
itself — no third-party action wrapper, no `GITLEAKS_LICENSE` required.
Uses the default gitleaks ruleset (the same one the gitleaks-action uses).
A finding fails the `gitleaks` check, which is a `required_status_check`
in the main-protection ruleset (ID 18567129) after PR #28. See §1 above
for the rationale on running the binary directly vs. using the action.

### Custom rules

If you need to add custom gitleaks rules (e.g., to flag
project-specific secret patterns), add a `.gitleaks.toml` at the repo
root. The action picks it up automatically. Do NOT add `allowlist` entries
to suppress findings — instead, rotate the secret and remove it from
history (see `SECURITY.md`).

### False positives

If gitleaks flags a false positive (e.g., a test fixture that looks like a
secret but isn't), add a targeted `allowlist` entry in `.gitleaks.toml` —
not a global regex suppress. Document the FP in the commit message and in
the PR description.

## 5. Ruleset relax/restore payloads (solo-operator merge workaround)

**This section is the authoritative reference for the relax/restore
workflow.** Copy these payloads verbatim. **Never leave the ruleset in the
relaxed state.**

### Background

The main-protection ruleset (ID 18567129) requires:

- `required_approving_review_count: 1`
- `require_code_owner_review: true`
- `required_review_thread_resolution: true`
- `required_status_check` rule requiring the `integration` check (added in
  PR #28 per ADR-012)
- `bypass_actors: []`
- `enforcement: "active"`

The operator is solo and cannot self-approve a PR. The workaround (Roadmap
§2.7.3): temporarily relax the ruleset (set the review requirements to
their non-blocking state, keep the required_status_check rule), squash-merge
the PR, then restore the ruleset to full strictness.

**After PR #28 lands, the relax/restore payloads MUST include the
`required_status_check` rule** so the CI check stays required even during
the brief relax window. If you use the old payloads (without the
required_status_check rule), the rule will be DROPPED from the ruleset on
relax, and you'll have to re-add it on restore — which is fragile. The
payloads below keep the rule in both states.

### Prerequisites

- The PR has passed CI (lint + typecheck + test-scripts + integration +
  gitleaks all green on the latest commit).
- An ADR-010 review session has run and posted its outcome as a PR comment
  with no unresolved BLOCK-level findings.
- The operator has reviewed the PR.

### Step 1 — RELAX the ruleset

```bash
# Set these env vars first:
#   export GH_TOKEN=ghp_...   (your PAT — must have admin:repo scope)
#   export OWNER=Thika-Management-Dz
#   export REPO=clinic-saas
#   export RULESET_ID=18567129

curl -s -X PUT \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$OWNER/$REPO/rulesets/$RULESET_ID" \
  -d '{
    "name": "main-protection",
    "enforcement": "active",
    "rules": [
      {
        "type": "pull_request",
        "parameters": {
          "required_approving_review_count": 0,
          "dismiss_stale_reviews_on_push": false,
          "require_code_owner_review": false,
          "require_last_push_approval": false,
          "required_review_thread_resolution": false,
          "allowed_merge_methods": ["merge", "squash", "rebase"]
        }
      },
      {
        "type": "required_status_checks",
        "parameters": {
          "strict_required_status_checks_policy": false,
          "required_status_checks": [
            {"context": "integration"},
            {"context": "lint"},
            {"context": "typecheck"},
            {"context": "test-scripts"},
            {"context": "gitleaks"}
          ]
        }
      },
      {
        "type": "required_linear_history"
      },
      {
        "type": "deletion"
      },
      {
        "type": "non_fast_forward"
      }
    ]
  }'
```

The key changes from full strictness: `required_approving_review_count: 0`,
`require_code_owner_review: false`, `required_review_thread_resolution:
false`. The `required_status_checks` rule is KEPT (with all 5 checks) so CI
must still pass before merge.

### Step 2 — Squash-merge the PR

```bash
# Use the GitHub API (gh CLI also works):
curl -s -X PUT \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER/merge" \
  -d '{
    "merge_method": "squash",
    "commit_title": "<conventional-commit subject> (#<PR-NUMBER>)",
    "commit_message": "<body — worklog summary, references>"
  }'
```

### Step 3 — RESTORE the ruleset to full strictness

```bash
curl -s -X PUT \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$OWNER/$REPO/rulesets/$RULESET_ID" \
  -d '{
    "name": "main-protection",
    "enforcement": "active",
    "rules": [
      {
        "type": "pull_request",
        "parameters": {
          "required_approving_review_count": 1,
          "dismiss_stale_reviews_on_push": false,
          "require_code_owner_review": true,
          "require_last_push_approval": false,
          "required_review_thread_resolution": true,
          "allowed_merge_methods": ["merge", "squash", "rebase"]
        }
      },
      {
        "type": "required_status_checks",
        "parameters": {
          "strict_required_status_checks_policy": false,
          "required_status_checks": [
            {"context": "integration"},
            {"context": "lint"},
            {"context": "typecheck"},
            {"context": "test-scripts"},
            {"context": "gitleaks"}
          ]
        }
      },
      {
        "type": "required_linear_history"
      },
      {
        "type": "deletion"
      },
      {
        "type": "non_fast_forward"
      }
    ]
  }'
```

### Step 4 — VERIFY the restore with a fresh GET

```bash
curl -s -X GET \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$OWNER/$REPO/rulesets/$RULESET_ID" \
  | python3 -m json.tool
```

Confirm ALL of:

- `enforcement: "active"`
- `bypass_actors: []`
- `rules` contains:
  - `pull_request` with `required_approving_review_count: 1`,
    `require_code_owner_review: true`,
    `required_review_thread_resolution: true`
  - `required_status_checks` with all 5 checks (`integration`, `lint`,
    `typecheck`, `test-scripts`, `gitleaks`)
  - `required_linear_history`
  - `deletion`
  - `non_fast_forward`

If any field is wrong, re-apply the restore payload (Step 3) and re-verify.

### If a new CI job is added in a future PR

Update the `required_status_checks` list in BOTH the relax and restore
payloads to include the new check's `context` name (matches the job's
`name:` field in `ci.yml` or `gitleaks.yml`). Do this in the same PR that
adds the new CI job, and document the change in this runbook.

## 6. Debugging CI failures

### "lint" job fails

- Read the eslint output. The eslint flat config is at
  `packages/eslint-config/flat-config.js` + per-app `eslint.config.mjs`.
- Common causes: unused vars, `any` types, `ml-/mr-/pl-/pr-` Tailwind
  utilities, hardcoded user-visible strings (i18n rule not yet enabled in
  Phase 4 — comes in Phase 6).
- Run locally: `pnpm lint`.

### "typecheck" job fails

- Read the `tsc` output. The strict tsconfig is at
  `packages/tsconfig/base.json` — flags include `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `verbatimModuleSyntax`.
- Common causes: missing type-only imports (`import { type Foo }`), accessing
  array indices without a null check (`arr[0]` returns `T | undefined`),
  optional prop mismatch.
- Run locally: `pnpm typecheck`.

### "test-scripts" job fails

- Read the bash test output. The tests are at
  `tests/test-setup-workstation.sh` (22 tests covering the Phase 1
  .npmrc-prefix-conflict fix and the verify-workstation.sh v-prefix
  comparison fix).
- Common causes: changes to `scripts/setup-workstation.sh` or
  `scripts/verify-workstation.sh` that broke the version-comparison logic.
- Run locally: `bash tests/test-setup-workstation.sh`.

### "integration" job fails

- Read the Vitest output. The 19 tests are in
  `packages/db/src/__tests__/rls.test.ts` (13) and
  `packages/db/src/__tests__/audit_log.test.ts` (6).
- Common causes:
  - A migration change broke the schema (check `pnpm db:migrate` output).
  - A new tenant-scoped table lacks FORCE RLS (the
    `every tenant-scoped table has ENABLE + FORCE RLS` test catches this).
  - The audit-log hash chain broke (the `hash_curr matches recomputed
    SHA-256` test catches this — recomputes the hash in Postgres and
    compares).
  - The Postgres service container didn't start (check the `services:`
    block health check).
- Run locally: see §2.

### "gitleaks" job fails

- Read the gitleaks output. The finding will include the file, line, and
  the rule that matched.
- **DO NOT** add an `allowlist` entry to suppress the finding without
  investigating first. Most findings are real secrets.
- If the secret is real: rotate it immediately at its source, then remove
  it from the codebase in the same PR. See `SECURITY.md` "Secret hygiene".
- If the secret is a false positive (e.g., a test fixture that looks like a
  real secret): add a targeted `allowlist` entry in `.gitleaks.toml` (NOT a
  global regex suppress). Document the FP in the commit message.

## 7. Renovate + CI

Renovate is configured in `.github/renovate.json5` to bump dependencies on
a weekly schedule (earlyMondays in Africa/Algiers timezone). With CI now
landed, Renovate's `automerge` could be enabled for patch-level updates of
non-critical packages — but it's currently `false` for all packages. The
operator may choose to enable automerge for dev-only deps in a future PR.

For now, Renovate opens PRs; CI validates them; the operator (or AI agent)
reviews + merges via the relax/restore workflow in §5.

## 8. Phase 7+ enhancements

The CI workflow is intentionally minimal for Phase 4. Future enhancements
(Phases 5-7+):

- **Phase 5 (Auth)**: add `pnpm --filter @clinic-saas/auth test` to the
  integration job (or a new `test-auth` job).
- **Phase 6 (i18n + UI)**: add `pnpm --filter @clinic-saas/ui test` (unit
  tests for shadcn components) and `pnpm test:e2e` (Playwright golden path
  in both locales).
- **Phase 7 (Observability)**: add Sentry source-map upload step, Docker
  image build + push, deployment preview. Also add a `build` job (currently
  omitted because Phase 4 has no shippable build).
- **Phase 7+ (CI secrets)**: add `DATABASE_URL_STAGING` and
  `MIGRATION_DATABASE_URL_STAGING` as GitHub Actions encrypted secrets (per
  ADR-011 Tier 2) to enable integration tests against Neon staging in
  addition to the local docker Postgres.
- **Phase 13+ (EgressGuard)**: add a CI test that asserts no outbound HTTP
  call from the API carries PII to a non-sovereign endpoint.

Each enhancement should update this runbook in the same PR.

## 9. References

- [ADR-010](../adr/ADR-010.md) — the manual AI-agent review session ADR.
- [ADR-012](../adr/ADR-012.md) — CI is the machine gate (rescinds ADR-010's
  "deferred to Phase 7" portions).
- [ADR-011](../adr/ADR-011.md) — secrets management (Tier 2 = GitHub
  Actions encrypted secrets for CI).
- [`SECURITY.md`](../../SECURITY.md) — vulnerability disclosure + secret hygiene.
- [`docs/runbooks/ai-agent-pr-review.md`](./ai-agent-pr-review.md) — the
  companion runbook for the manual AI-agent review session (the second
  layer of the merge gate).
- [`docs/runbooks/neon-staging.md`](./neon-staging.md) — Neon staging DB
  setup (used for local integration tests if you don't want to run Docker).
- [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — the CI
  workflow itself.
- [`.github/workflows/gitleaks.yml`](../../.github/workflows/gitleaks.yml) —
  the gitleaks secret-scanning workflow.
- [`.pre-commit-config.yaml`](../../.pre-commit-config.yaml) — local
  gitleaks pre-commit hook.
- [Critical code review](../audits/2026-07-07-critical-review.pdf) §3.1
  (P0-1), §7.2 (DX), §9.1 (30-day blockers) — the audit that motivated CI.
- [Remediation tracker](../remediation/30-60-90-day-plan.md) — 30-1, 30-2,
  30-6, 30-7, 30-8 are the items this runbook's CI implementation closes.
