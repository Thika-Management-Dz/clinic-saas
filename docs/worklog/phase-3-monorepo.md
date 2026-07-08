# Worklog — Phase 3: Monorepo Scaffold

> Summarized archive of AI-agent sessions for Phase 3. Source: original
> `WORKLOG.md` (pre-split, 2026-07-08, commit `f9192a5b`). For full session
> transcripts, see `git log --grep="Task 1[2-7]"` or the PRs/issues linked
> below. (There is no Phase 2 worklog — Phase 2 was the Renovate config
> already handled in Phase 0.)

## Phase outcome

Phase 3 delivered the pnpm + Turborepo monorepo scaffold in three atomic
PRs (workspace skeleton → 7 shared packages → 4 app shells). Two
fresh-context review sessions (Tasks 13 + 15) found one BLOCK (the
`no-internal-modules` eslint rule silently failed to enforce Blueprint
§7.4) and 4 NITs across PRs #7–#9. Two deferred judgment calls (JC-6-3,
JC-8-1) were pulled forward to Tasks 17-a and 17-b. All 17 judgment calls
from PRs #6–#9 were independently reassessed and confirmed.

## Key decisions

- **No new ADRs** — Roadmap §3 doesn't reference any missing ADRs; all
  architectural decisions are covered by ADR-001..006.
- **JC-7-1:** No `.gitkeep` files (workspace globs handle empty case).
  **JC-7-2:** `pnpm-lock.yaml` committed (Renovate + CI reproducibility).
  **JC-7-3:** Root `package.json` includes `db:*` scripts per Roadmap
  §3.1.2 even though `packages/db` is a stub at PR A time.
- **JC-8-1 (deferred Phase 6, pulled forward in 17-b):** 13 shadcn
  components added to `packages/ui`, re-exported from `src/index.ts`.
  RTL audited clean. `components.json` got `"rtl": true` added (was
  missing — pre-existing gap). 2 `exactOptionalPropertyTypes` patches.
  NOT wired into `apps/web` (Phase 6).
- **JC-8-2/8-3/8-4/8-5:** No `@nestjs/eslint-plugin` (doesn't exist on
  npm). 8 generic seed i18n keys (minimal seed, not real impl). React 19
  (Next.js 16 requires it). `onlyBuiltDependencies` redundant with
  `allowBuilds` in pnpm 11.10 — harmless, kept for older-tool compat.
- **JC-9-1:** `apps/web` home page has NO hardcoded text (AGENTS.md
  Do-NOT #4) — styled colored-bar placeholder. Phase 6 will replace with
  `t('common.appName')`.
- **JC-9-2:** `verbatimModuleSyntax: false` in `nestjs.json` (necessary
  for CommonJS compilation that NestJS requires).
- **JC-9-3 (RESOLVED by PR #10):** `import/order` was disabled because
  `eslint-plugin-import` 2.32.0 crashes on ESLint 10. PR #10 switched to
  `eslint-plugin-import-x` 4.17.1 and re-enabled `import/order`.
- **JC-9-4/9-5/9-6:** Root `eslint.config.mjs` as fallback (standard
  ESLint 9+ pattern). `eslint-config` package has no lint script
  (configuration, not code). Worker HTTP server on port 3002 for k8s
  liveness probes (Phase 15+) + API consistency.
- **JC-6-3 (deferred Phase 8, pulled forward in 17-a):** Added
  `tests/test-setup-workstation.sh` (22 plain-bash assertions, zero
  deps, ~10ms). Chose plain bash over bats — small test surface.
  `test:scripts` script in root package.json; NOT wired into turbo's
  `test` task (intentional).
- **BLOCK-1 (Task 13, fixed in PR #10):** `import/no-internal-modules`
  was a no-op without `eslint-import-resolver-typescript` — previous
  self-review claim that it enforced Blueprint §7.4 was FALSE. Fixed by
  switching to `eslint-plugin-import-x` + adding
  `eslint-import-resolver-typescript` + adding `no-restricted-imports`
  with pattern `@clinic-saas/*/src/**` (the actual enforcement).
- **BLOCK-2 (Task 16, fixed in PR #14):** PR #10's
  `import/no-internal-modules` rule (kept as "defense-in-depth") blocked
  legitimate declared subpaths (`@clinic-saas/db/schema`,
  `@clinic-saas/ui/styles/globals.css`). Fixed in PR #14 by removing the
  rule entirely (no-restricted-imports is sufficient).

## Sessions

| Task ID | Agent | PR/Issue | Summary |
|---------|-------|----------|---------|
| 12 | Super Z (Phase 3 — 3 PRs) | PRs #7, #8, #9 | 3 atomic PRs: #7 workspace skeleton (pnpm + turbo), #8 7 shared package stubs, #9 4 app shells. All pnpm commands exit 0. No new ADRs. |
| 13 | Super Z (fresh-context review of Tasks 11+12) | Issue #11 + PR #10 | 15-item ADR-010 checklist on PRs #6–#9: 1 BLOCK in PR #8 (no-internal-modules no-op) + 4 NITs. Fixed via PR #10: switched to `eslint-plugin-import-x`, added `eslint-import-resolver-typescript`, added `no-restricted-imports` with `@clinic-saas/*/src/**`. |
| 14 | Super Z (reassessment of 17 JCs) | Issue #12 (worklog only) | All 17 JCs: ACCEPT 14, DEFER 2 (JC-6-3 → Phase 8, JC-8-1 → Phase 6), RESOLVED 1 (JC-9-3 via PR #10), CHANGE 0. |
| 15 | Super Z (fresh-context review of Task 14) | Issue #13 | Independently reassessed all 17 Task 14 JCs: AGREE 17, DISAGREE 0. Clean review. |
| 16 | Super Z (fresh-context re-review of PR #10) | PR #10 comment + PR #14 | 1 BLOCK: `import/no-internal-modules` blocked legitimate declared subpaths (`@clinic-saas/db/schema`, `@clinic-saas/ui/styles/globals.css`). Fixed in PR #14 by removing the rule. |
| 17-a | Super Z (JC-6-3 pull-forward — setup script tests) | PR #15 | Added `tests/test-setup-workstation.sh` (22 plain-bash assertions). `test:scripts` in root package.json. JC-6-3 RESOLVED. |
| 17-b | Super Z (JC-8-1 pull-forward — 13 shadcn components) | PR #16 | Added 13 shadcn components to `packages/ui` + `"rtl": true` in components.json (was missing) + 2 `exactOptionalPropertyTypes` patches. JC-8-1 RESOLVED. |

## Open follow-ups (still open as of 2026-07-08)

- **Phase 6 follow-up (from Task 17-b):** wire the 13 shadcn components
  into `apps/web` (Phase 6 = RTL/i18n scaffold; will also do next-intl
  wiring, locale routing, full RTL audit of `apps/web`).
- **PR #24 NIT 1 (unused eslint-disable in `audit_log.test.ts:15`):**
  deferred to a Phase 5+ cleanup pass. (Phase 5 PR #33 is now merged —
  check whether this is still latent.)
- **PR #20 NIT 2 (role_inheritance self-inheritance CHECK missing):**
  tracked as remediation item 60-7 (role_inheritance cycle prevention),
  status `pending`.
- **Cross-cutting security reminder:** operator's GitHub PAT was shared
  in chat and must be rotated at https://github.com/settings/tokens.

## Ruleset state at end of phase

- **main-protection (ID 18567129):** strict. `enforcement=active`,
  `bypass_actors=[]`, `pull_request` with
  `required_approving_review_count=1`, `require_code_owner_review=true`,
  `required_review_thread_resolution=true`. Plus `required_linear_history`,
  `deletion`, `non_fast_forward`. **No `required_status_checks` rule yet**
  (added in PR #28 / Task 20-a).
- Relax/restore was used 6 times (PRs #7, #8, #9, #10, #14, #15, #16);
  each time the ruleset was immediately restored and verified with a
  fresh GET.
