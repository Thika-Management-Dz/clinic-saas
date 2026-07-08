# Worklog — Post-Phase-4: Critical-Review Audit + Remediation Sprint

> Summarized archive of AI-agent sessions for the post-Phase-4 audit and
> remediation sprint. Source: original `WORKLOG.md` (pre-split, 2026-07-08,
> commit `f9192a5b`). For full session transcripts, see
> `git log --grep="Task (19|20|21)"` or the PRs linked below.

## Phase outcome

After Phase 4 landed, the operator uploaded a 23-page critical code review
(`docs/audits/2026-07-07-critical-review.pdf`) identifying 6 P0 blockers +
9 P1 findings. The remediation sprint delivered 4 PRs that closed all 8
30-day blockers: PR #28 (CI machine gate + gitleaks + SECURITY.md +
ADR-012), PR #29 (per-tenant audit hash chain + withTenant UUID
validation + `set_tenant()` function), PR #31 (dev DB credential rotation
via psql `:var` substitution + production fail-fast), plus docs PRs (#26,
#27, #30, #32). The project was cleared to start Phase 5 (PR #33 has
since merged).

## Key decisions

- **ADR-011 (3-tier secrets posture):** Tier 1 = gitignored `.env.staging`
  now; Tier 2 = GitHub Actions encrypted secrets in Phase 7; Tier 3 =
  on-host `.env` + systemd `LoadCredential` in Phase 16. Doppler Service
  Tokens require Team plan (~$99/mo) — operator deferred Doppler to
  post-revenue.
- **ADR-012 (CI is the machine gate):** Rescinds ADR-010's "CI deferred
  to Phase 7" portions. Merge gate = CI machine-enforced layer (5
  `required_status_checks`: integration, lint, typecheck, test-scripts,
  gitleaks) + ADR-010 manual review as second layer. Relax/restore
  payloads MUST include the `required_status_check` rule going forward.
- **gitleaks binary run directly** (not `gitleaks-action`): the action
  wrapper requires a `GITLEAKS_LICENSE` secret for org repos. Binary
  v8.30.1 is downloaded with SHA256 verification
  (`551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb`).
- **P0-3 fix (PR #29):** `withTenant` UUID regex validation before the
  `unsafe()` interpolation. Phase 5's TenantInterceptor MUST use the
  parameterized `set_tenant(uuid)` function instead.
- **P0-4 + P0-5 fix (PR #29):** `compute_audit_hash_curr()` redesigned
  with per-tenant `WHERE tenant_id = NEW.tenant_id` prev_hash lookup +
  `pg_advisory_xact_lock(hashtext(NEW.tenant_id::text))` serialization.
  Each tenant has its own independent hash chain. Function remains
  SECURITY DEFINER + SET search_path=public.
- **`set_tenant(p_tenant uuid)` function** (new `004_set_tenant.sql`,
  PR #29): Phase 5's TenantInterceptor calls `SELECT set_tenant($1)`.
  `set_config('app.current_tenant', p_tenant::text, true)` = `SET LOCAL`.
- **P0-2 / 30-3 fix (PR #31):** `001_roles.sql` uses psql `:var`
  substitution (no plaintext credentials). New `001_roles.sh` wrapper.
  CI passes dev values via `-v` flags. `main.ts` adds
  `assertNoDevCredentialsInProduction()` fail-fast.
- **3 pre-existing bugs fixed in PR #28** (CI exposed them — all silently
  broken because operator always used Neon): (1) `001_roles.sql` lacked
  `GRANT CREATE ON DATABASE` + `GRANT USAGE, CREATE ON SCHEMA public`
  for `ops_superuser`. (2) `helpers.ts` hardcoded `ssl: 'require'` —
  fails for docker-compose; now respects URL's `sslmode` param. (3)
  Vitest parallel file execution cleanup race — fixed with
  `--no-file-parallelism`.
- **ci.md §5 relax/restore schema fix (PR #29):** initial
  `required_status_checks` payload had invalid `integration_id` +
  `do_not_enforce_on_create` fields (API 422). Valid schema is
  `{"context": "..."}` per check + `strict_required_status_checks_policy:
  false`. Both RELAX and RESTORE payloads corrected.
- **Task 19-a entry is a historical reconstruction** written in Task
  19-b's session — the original 19-a session did not commit a worklog
  entry (sandbox-local draft not recoverable).

## Sessions

| Task ID | Agent | PR | Summary |
|---------|-------|----|---------|
| 19-a | Super Z (fresh-context review of Phase 4 PRs) | 6 PR comments | Reviewed PRs #18, #20, #22, #23, #24, #25 against 15-item ADR-010 checklist — 0 BLOCKs, 13 NITs, all MERGE-READY. Did NOT run runtime verification (rotation dispute). Entry is a historical reconstruction. |
| 19-b | Super Z (Phase 4 runtime verification on Neon + ADR-011) | PR #26 | Completed 7 runtime verification items (all PASS). Wrote ADR-011 (3-tier secrets). Fixed PR #25 NIT 1. |
| 19-c | Super Z (handoff + critical review upload + remediation tracker) | PR #27 | Uploaded 23-page critical review PDF + MD transcription. Created `docs/remediation/30-60-90-day-plan.md`. Wrote redacted handoff at `docs/handoffs/2026-07-07-pr1-pr2-handoff.md`. |
| 20-a | Super Z (PR1 — CI + machine gate) | PR #28 | `ci.yml` (4 jobs, Postgres 17 service container, actions pinned to SHA), `gitleaks.yml` (binary direct), `.pre-commit-config.yaml`, `SECURITY.md`, Orthanc pinned to `26.6.1`. Wrote ADR-012 + `docs/runbooks/ci.md`. Fixed 3 pre-existing bugs. Addresses 30-1, 30-6, 30-7, 30-8. |
| 20-a (cont.) | Super Z (PR1 merge + ruleset update + ci.md schema fix) | PR #28 merge + post-merge API | Merged PR #28. POST-merge: PUT the ruleset again to ADD the `required_status_check` rule. Initial payload rejected (422) — fixed schema to `{"context": "..."}` only. Verified 5 rules, all strict. |
| 20-b | Super Z (PR2 — audit hash chain redesign + withTenant fix + set_tenant) | PR #29 | Redesigned `compute_audit_hash_curr()` (per-tenant + advisory lock — fixes P0-4 + P0-5). Added UUID regex to `withTenant` (fixes P0-3). Created `set_tenant()` function for Phase 5. 21/21 PASS. |
| 20-b (cont.) | Super Z (PR2 merge + remediation tracker finalization) | PR #29 merge | Merged PR #29 — first PR merge with `required_status_check` rule in the relax payload. Updated remediation tracker: 30-4, 30-5, P0-3, P0-4, P0-5 done. |
| 21 | Super Z (PR3 — dev DB cred rotation, 30-3 closure) | PR #31 | Closed last 30-day blocker: `001_roles.sql` uses psql `:var` substitution, new `001_roles.sh` wrapper, CI passes via `-v` flags, `main.ts` adds production fail-fast. **ALL 8 THIRTY-DAY BLOCKERS DONE.** |

## Open follow-ups (still open as of 2026-07-08)

- **GitHub PAT rotation (cross-cutting):** operator's PAT (`ghp_G6G1...`)
  shared in plain text across multiple sessions. Per operator authority
  "accepted risk" — but per Task 22 brief, the operator should rotate it
  at https://github.com/settings/tokens.
- **Neon DB password rotation (cross-cutting):** `neondb_owner` password
  (`npg_...`) shared in chat. Rotation procedure in
  `docs/runbooks/neon-staging.md` §"Rotate the Neon DB password if it
  leaks".
- **Phase 5 (PR #33) is now MERGED** — Task 22 brief said "PR #33 is
  already open" but main has advanced to `d887534` (PR #33 squash-merged
  2026-07-08). Future sessions: treat Phase 5 as DONE.
- **Remaining 60-day + 90-day remediation items:** see
  `docs/remediation/30-60-90-day-plan.md` for the authoritative list.
  Notable `pending` items: 60-2 (db barrel exports), 60-3 (real health
  checks), 60-4 (Fastify body size + CORS + rate limiting), 60-5
  (updated_at trigger), 60-6 (audit_log.outcome enum + CHECKs), 60-7
  (role_inheritance cycle prevention), 60-10 (trivy Docker image scan),
  90-2 (created_by/updated_by), 90-3 (audit_log failure index), 90-5
  (ANPDP/DPO/DPIA), 90-6 (hire 2nd engineer).
- **PR #24 NIT 1** (unused eslint-disable in `audit_log.test.ts:15`):
  deferred to Phase 5+ cleanup. Re-check whether PR #33 addressed it.
- **13 NITs from Task 19-a's 6 PR reviews** documented in PR comment IDs
  4899186016, 4899185938, 4899185852, 4899185789, 4899185701, 4899185594.

## Ruleset state at end of phase

- **main-protection (ID 18567129):** strict, with the new
  `required_status_check` rule. `enforcement=active`, `bypass_actors=[]`,
  5 rules total:
  1. `pull_request` (`required_approving_review_count=1`,
     `require_code_owner_review=true`,
     `required_review_thread_resolution=true`)
  2. `required_status_checks` (5 checks: `integration`, `lint`,
     `typecheck`, `test-scripts`, `gitleaks`;
     `strict_required_status_checks_policy=false`)
  3. `required_linear_history` · 4. `deletion` · 5. `non_fast_forward`
- Relax/restore was used 5 times (PRs #26, #27, #28, #29, #31); each time
  immediately restored and verified. PR #29 was the first PR merge with
  the `required_status_check` rule in the relax payload — proving the
  corrected `docs/runbooks/ci.md §5` payloads work.
