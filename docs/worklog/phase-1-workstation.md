# Worklog — Phase 1: Workstation Setup

> Summarized archive of AI-agent sessions for Phase 1. Source: original
> `WORKLOG.md` (pre-split, 2026-07-08, commit `f9192a5b`). For full session
> transcripts, see `git log --grep="Task [89]"` or the PRs linked below.

## Phase outcome

Phase 1 delivered the headless AI-agent workstation setup: two idempotent
bash scripts (`scripts/setup-workstation.sh`, `scripts/verify-workstation.sh`),
a phase-tagged `.env.example`, a workstation-setup runbook, and the shared
`WORKLOG.md` itself committed to the repo. Two script bugs found during
end-to-end validation were fixed (`.npmrc` prefix conflict, `node --version`
`v`-prefix mismatch). The editor-installation section was removed from the
Roadmap because AI agents run headlessly.

## Key decisions

- **VS Code / editor tooling removed** from Phase 1. The agent sandbox does
  not need VS Code or its extensions — all six extensions from Roadmap §1.5
  are editor UIs for CLI tools that run fine headlessly. §1.5 was removed
  from `docs/roadmap-v2.1.md`; `.gitignore` defensive `.vscode/` patterns
  removed. The `~/.cache/ms-playwright` CI browser cache path (Roadmap line
  ~1575) was correctly preserved — it is NOT a VS Code reference.
- **Token-based env-var auth replaces browser-based CLI login** (new §1.6
  in Roadmap). Each CLI (Vercel, Sentry, Wrangler, Doppler, gh) reads its
  token from an env var per `.env.example`.
- **`.npmrc` prefix conflict auto-handled.** When `~/.npmrc` has
  `prefix=...` or `globalconfig=...` (set by sandbox-managed global npm
  modules), `nvm use` exits 11. Setup script now detects the conflict,
  warns the operator, and removes the offending line(s) via `sed -i`
  BEFORE calling `nvm install`. Destructive but minimal (one line, other
  lines preserved); documented in 3 places (5 warn lines + runbook +
  worklog).
- **`verify-workstation.sh` uses `v$NODE_VERSION`** as the expected value
  (was comparing `v24.18.0` against `24.18.0` — failed).
- **WORKLOG.md committed to the repo** (not sandbox-local). Original
  handoff plan was broken — the next session couldn't see the agent's
  sandbox. Convention established: append-only, each entry starts with
  `---`, includes Task ID / Agent / Task / Work Log / Stage Summary.
- **Pinned versions match Roadmap §1.1–§1.6 exactly:** Node 24.18.0, pnpm
  11.10.0, nvm 0.40.1, git ≥2.45, Docker ≥27 (optional in sandbox),
  Vercel 54.20.1, Sentry CLI 2.45.0, Doppler ≥0.5.10 (optional in sandbox),
  gh ≥2.65 (optional in sandbox). Optional tools missing in sandbox are
  sandbox limitations, not script bugs.

## Sessions

| Task ID | Agent | PR | Summary (≤2 sentences) |
|---------|-------|----|------------------------|
| 8 | Super Z (Phase 1 prep draft) | — | Drafted 4 artifacts (setup-workstation.sh, verify-workstation.sh, .env.example, README) in sandbox; answered operator's VS Code question (NO, agent sandbox doesn't need it). Did NOT commit. |
| 8 (cont.) | Super Z (VS Code removal + handoff) | — | Removed all VS Code mentions from draft files; inventoried VS Code mentions in committed repo (only `roadmap-v2.1.md §1.5` + `.gitignore` `.vscode/` patterns needed edits). Wrote handoff prompt for next session. |
| 9 | Super Z (Phase 1 PR open + review) | PR #4 | Opened Phase 1 PR (branch `agent/9-phase1-workstation-setup`): edited Roadmap §1.5/1.6/1.7 + `.gitignore`, added 4 new files. Posted AI Agent Review Session comment (PASS, comment ID 4895241016). Did NOT merge — left for next session. |
| 9 (cont.) | Super Z (WORKLOG.md added to repo) | PR #4 (3rd commit) | Added `WORKLOG.md` to the repo as a third commit on PR #4's branch so future sessions can read it. Established the append-only convention. |
| 10 | Super Z (Phase 1 PR #4 merge + verify) | PR #4 merge + PR #5 (worklog) | Squash-merged PR #4 (commit `5a16261`) via relax/restore workflow; verified ruleset restore with fresh GET. Final repo-wide editor-mention grep: zero actionable matches (only historical narrative in WORKLOG.md + the `ms-playwright` CI cache path). Opened PR #5 (docs-only) to append the Task 10 worklog entry. |
| 11 | Super Z (Phase 1 validation — run setup-workstation.sh end-to-end) | PR #6 | Ran `setup-workstation.sh` end-to-end in fresh sandbox; exit 11 due to `.npmrc` prefix conflict (script bug) — fixed with sed auto-removal. Then `verify-workstation.sh` failed on `v`-prefix mismatch — fixed by using `v$NODE_VERSION`. All pinned tools verified at correct versions; optional tools (docker/gh/doppler) correctly warn as MISSING. Added 2 troubleshooting entries to `docs/runbooks/workstation-setup.md`. |

## Open follow-ups (still open as of 2026-07-08)

- **Task 8 open questions for operator:** devcontainer.json (deferred —
  not yet addressed), sigstore/gitsign commit signing (skipped —
  decision was to skip), token rotation runbook (suggested — DB
  rotation procedure documented in `docs/runbooks/neon-staging.md` per
  90-10; GitHub PAT rotation is a recurring reminder in worklog entries
  but no dedicated runbook exists yet).
- **None other phase-specific.** All Phase 1 follow-ups closed: script
  bugs fixed (PR #6), automated bash tests added (Task 17-a / PR #15,
  see Phase 3 worklog for JC-6-3 pull-forward), and the test:scripts
  job is wired into CI (PR #28 / Task 20-a).
- **Cross-cutting security reminder:** the operator's GitHub PAT was shared
  in chat and must be rotated at https://github.com/settings/tokens.

## Ruleset state at end of phase

- **main-protection (ID 18567129):** strict. `enforcement=active`,
  `bypass_actors=[]`, `pull_request` with
  `required_approving_review_count=1`, `require_code_owner_review=true`,
  `required_review_thread_resolution=true`. Plus `required_linear_history`,
  `deletion`, `non_fast_forward`. **No `required_status_checks` rule yet.**
- Relax/restore was used twice (PR #4, PR #5); both times the ruleset was
  immediately restored and verified with a fresh GET.
