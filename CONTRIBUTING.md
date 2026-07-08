# Contributing

This project follows an **AI-agent-driven workflow**: specifications are written
as GitHub Issues (issue-as-spec), handed to an AI coding agent on a feature
branch, reviewed as a pull request, and merged only when CI is green, an **AI
agent review session** has run (see [ADR-010](./docs/adr/ADR-010.md) and the
[review-session runbook](./docs/runbooks/ai-agent-pr-review.md)), and a human
has reviewed.

> **Note on the review bot.** Roadmap v2.1 §2.6 originally prescribed an
> always-on third-party AI PR review bot. That approach is **superseded by
> [ADR-010](./docs/adr/ADR-010.md)**: the operator runs a manual AI agent
> review session per PR instead. Reasons: no third-party egress of PR diffs,
> zero additional tooling cost (reuses the coding agent), and a
> version-controlled review prompt that evolves with AGENTS.md.

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
docs(adr): add ADR-011 FHIR export strategy
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `build`,
`ci`.

## Dependency Injection

All constructor-injected providers in NestJS apps (`apps/api`,
`apps/worker`, any future NestJS app) MUST use explicit `@Inject(Token)`
decorators — not implicit constructor injection. This is required for
tsx/esbuild compatibility in dev mode (esbuild does not emit
`emitDecoratorMetadata`, so implicit injection is `undefined` at runtime
without the explicit decorator).

See [ADR-013](./docs/adr/ADR-013-explicit-inject-decorators.md) for the
full rationale, alternatives considered, and enforcement mechanisms.

```typescript
// ✅ Correct
import { Controller, Get, Inject } from '@nestjs/common';
import { HealthService } from './health.service.js';

@Controller()
export class HealthController {
  constructor(@Inject(HealthService) private readonly health: HealthService) {}
}

// ❌ Forbidden — undefined at runtime under tsx/esbuild
@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}
}
```

Enforcement is layered: the **`clinic-saas/require-inject` ESLint rule**
(catches violations at lint time — proactive), **code review** (second
line of defense), and the **`smoke` CI job** (boots the API via tsx and
catches `undefined` deps at runtime — reactive safety net). The pattern
applies to all `@Injectable()`, `@Controller()`, `@Guard()`,
`@Interceptor()`, `@Pipe()`, and `@Filter()` classes with
constructor-injected params.

## Pull Requests

Use the PR template (`.github/PULL_REQUEST_TEMPLATE.md`). No PR merges
without:

1. Green CI (`lint`, `typecheck`, `test`, `build` — once Phase 7 lands; until
   then, the author's local `pnpm lint && pnpm typecheck && pnpm test`).
2. An **AI agent review session** has run and its outcome is posted as a PR
   comment, with no unresolved `BLOCK`-level findings. See
   [`docs/runbooks/ai-agent-pr-review.md`](./docs/runbooks/ai-agent-pr-review.md)
   and [ADR-010](./docs/adr/ADR-010.md). *(Replaces the always-on AI PR review
   bot from Roadmap §2.6.)*
3. One human review (the operator's own review of an agent's PR counts).
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
