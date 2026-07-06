# Contributing

This project follows an **AI-agent-driven workflow**: specifications are written
as GitHub Issues (issue-as-spec), handed to an AI coding agent on a feature
branch, reviewed as a pull request, and merged only when CI is green, a human
has reviewed, and the AI-PR-review bot approves.

## Before You Write Code

Read [`AGENTS.md`](./AGENTS.md). It is the single source of truth for build
commands, architecture rules, i18n/RTL rules, and the Do-NOT list.

## Branch Naming

- `agent/<task-id>-<short-desc>` — AI-agent work
- `feat/<task-id>` — human-directed feature
- `fix/<task-id>` — bugfix
- `chore/<task-id>` — tooling, deps, refactor

## Commit Messages

Conventional Commits:

```
feat(dental): add FDI odontogram chart component
fix(billing): correct TVA rounding on 19% lines
chore(deps): bump drizzle-orm to latest
docs(adr): add ADR-010 FHIR export strategy
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `build`,
`ci`.

## Pull Requests

Use the PR template (`.github/PULL_REQUEST_TEMPLATE.md`). No PR merges
without:

1. Green CI (`lint`, `typecheck`, `test`, `build`).
2. One human review (the operator's own review of an agent's PR counts).
3. AI-PR-review-bot approval (enforces AGENTS.md rules).
4. All conversations resolved.

For UI changes, screenshots/recordings in both locales (ar-DZ RTL + fr-DZ LTR)
are mandatory.

## Issue-as-Spec

Use the `agent-task.yml` issue template. An issue is pickup-ready when it
contains: a user story, acceptance criteria (checkboxes), file paths to touch,
test expectations, AGENTS.md references, and an out-of-scope section. An agent
should be able to complete it cold without additional context.

## Self-Verification Checklist (in every PR)

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] AGENTS.md rules respected (RLS, soft deletes, next-intl, logical props)
- [ ] No PII in logs / Sentry / PostHog
- [ ] No hardcoded user-visible strings
- [ ] No physical left/right CSS for layout
- [ ] No FHIR JSON stored internally
- [ ] FDI tooth notation only
