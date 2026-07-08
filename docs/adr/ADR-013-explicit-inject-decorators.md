# ADR-013: Explicit `@Inject(Token)` Decorators for All Constructor-Injected Providers

- **Status:** Accepted
- **Date:** 2026-07-08
- **Blueprint references:** Roadmap v2.1 §5.1.1 (Better Auth), §3.4.2 (TS toolchain), §3.6.4 (API bootstrap)
- **Supersedes:** none
- **Superseded by:** none
- **Decider:** Operator (AguHo)
- **PR:** #39 (Task 24 — original adoption); #41 (Task 25 — added ESLint enforcement)
- **Related:** [ADR-004](./ADR-004.md) (Better Auth + Organization plugin), [ADR-002](./ADR-002.md) (modular monolith), WORKLOG.md Task 23 (root-cause analysis of the PR #37 DI bugs)

## Context

Phase 5 (PR #33) added Better Auth + the TenantInterceptor + PermissionsGuard +
AuditInterceptor + EgressGuard to `apps/api`. When PR #33 landed, the API
**refused to boot** in dev mode. Three classes of bug surfaced:

1. **Module-export bugs** (`audit.module.ts`, `rls.module.ts`, `egress.module.ts`):
   the modules exported providers that weren't in their `providers` array, or
   exported a function (NestJS only exports classes). These were caught by
   NestJS at bootstrap with a clear error message. Fixed in PR #37.

2. **Missing `emitDecoratorMetadata`** (`health.controller.ts`,
   `permissions.guard.ts`, `tenant.interceptor.ts`): the API booted, but
   every request 500'd with `Cannot read properties of undefined
   (reading 'getAllAndOverride')` in `PermissionsGuard.canActivate`. Root
   cause: the dev-mode loader is **tsx** (esbuild-based), and esbuild does
   NOT support `emitDecoratorMetadata`. Without that metadata, NestJS's
   DI container cannot infer constructor parameter types from the design
   time type information — so injected dependencies are `undefined` at
   runtime. Fixed in PR #37 by adding explicit `@Inject(Token)` decorators.

3. **Stale Drizzle migration** (`0001_tense_living_mummy.sql`): generated
   before the CRITICAL-3 fix added `clinic_id` to `organization`. The
   TenantInterceptor at `tenant.interceptor.ts:117` does
   `SELECT clinic_id FROM organization WHERE id = ${tenantId}` — without
   the column, every non-exempt request would 500 with "Organization has
   no clinic_id mapping". Fixed in PR #36 by regenerating the migration.

CI caught **none** of these bugs. The Phase 5 CI suite runs 5 jobs:
`lint`, `typecheck`, `test-scripts`, `integration` (Vitest against a
Postgres service container — DB schema + RLS only), `gitleaks`. **None
of them boot the NestJS API.** The lint and typecheck jobs compile the
TypeScript successfully (the code is syntactically correct), but they
don't instantiate the DI container. The integration job tests the DB
layer in isolation — it doesn't exercise the NestJS bootstrap path.

The Phase 5 smoke test (added to CI in PR #39 per Task 24 as the `smoke`
job) catches all three classes by actually booting the API via tsx and
exercising the auth flow end-to-end. But the smoke test is reactive —
it catches the bug AFTER it's been written. This ADR addresses the
**proactive** side: making the `@Inject(Token)` pattern the project
standard so future constructor-injected providers don't break under
tsx/esbuild in the first place.

### Why esbuild doesn't emit `emitDecoratorMetadata`

`emitDecoratorMetadata` is a TypeScript compiler option (built on top
of the experimental `reflect-metadata` polyfill). When enabled, `tsc`
emits `Reflect.metadata("design:paramtypes", [TypeA, TypeB, ...])` calls
on decorated classes. NestJS's DI container reads this metadata to
resolve constructor parameter types.

esbuild — which tsx uses as its TypeScript compiler — supports decorators
but **does not emit `design:paramtypes` metadata**. This is a well-known
limitation, documented in the esbuild FAQ:
<https://esbuild.github.io/api/#metadata>. The esbuild maintainer's
rationale: the metadata polyfill is non-standard, adds runtime cost,
and the same effect can be achieved with explicit `@Inject(Token)`
decorators that don't rely on metadata reflection.

### Why tsx is used in dev mode

The project uses tsx (esbuild-based) for dev-mode TypeScript execution
because:

- **Speed**: tsx cold-starts in ~1s; `nest start --watch` (tsc + watch
  mode) takes 5-10s on the Phase 5 codebase. The difference compounds
  across the dozens of restarts a developer does per day.
- **ESM-native**: tsx resolves `.ts` imports directly via the Node ESM
  loader hook, no build step required. This matches the project's
  `"type": "module"` setup.
- **Workspace package imports**: the `@clinic-saas/*` workspace packages
  ship `.ts` source (not built `dist/`). tsx resolves these via the
  Node ESM loader; tsc would require either pre-building each workspace
  package or running in a watcher mode.

The trade-off: tsx gives up `emitDecoratorMetadata`. This ADR accepts
that trade-off and mandates the explicit `@Inject(Token)` pattern that
works regardless of whether metadata is emitted.

## Decision

**All constructor-injected providers in NestJS apps MUST use explicit
`@Inject(Token)` decorators.** This applies to every `@Injectable()` or
`@Controller()` class with a constructor that has injected parameters
(anywhere in `apps/api`, `apps/worker`, and any future NestJS app).

### Pattern

```typescript
// ✅ Correct — explicit @Inject(Token)
import { Controller, Get, Inject } from '@nestjs/common';
import { HealthService } from './health.service.js';

@Controller()
export class HealthController {
  constructor(@Inject(HealthService) private readonly health: HealthService) {}

  @Get()
  check() {
    return this.health.check();
  }
}
```

```typescript
// ❌ Forbidden — relies on emitDecoratorMetadata (broken under tsx/esbuild)
import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service.js';

@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}
  //                  ^^^^^^^^^^^ undefined at runtime under tsx
}
```

The `Token` passed to `@Inject(Token)` is the provider's class (for
class-based providers) or the injection token (for symbol/string-based
providers). For NestJS built-in providers like `Reflector`, use
`@Inject(Reflector)`.

### Where this applies

- Every `@Injectable()` class with a constructor that has injected params.
- Every `@Controller()` class with a constructor that has injected params.
- Every `@Guard()`, `@Interceptor()`, `@Pipe()`, `@Filter()` class with
  a constructor that has injected params.

### Where this does NOT apply

- Classes that have no constructor (no DI).
- Classes whose constructor only takes NestJS parameter decorators that
  don't need DI resolution (e.g., `@Req()`, `@Res()`, `@Body()` — these
  are resolved by the framework's request-scoped parameter decorator
  mechanism, not by the DI container).
- Classes that create their own dependencies via `new` (e.g.,
  `new Logger(MyService.name)` — this is not DI and doesn't need
  `@Inject`).

## Consequences

### Positive

- **Works with any TS compiler** (tsc, tsx, swc, esbuild). The code is
  portable across toolchains without configuration changes.
- **More defensive** — the dependency is declared explicitly in source,
  not inferred from type metadata that may or may not be emitted. A
  reader can see what's being injected without reasoning about
  TypeScript's metadata reflection.
- **Survives toolchain migrations** — if the project later switches
  from tsx to swc (or vice versa), no code changes are needed in
  provider constructors.
- **Catches typos at boot** — `@Inject(HealthService)` resolves the
  provider eagerly at bootstrap. If `HealthService` isn't registered
  in any module's `providers`, NestJS throws immediately on boot
  (rather than returning `undefined` at runtime).

### Negative

- **More verbose** — every constructor parameter needs `@Inject(Token)`
  prefix. For classes with 5+ injected deps, this gets visually noisy.
  Accepted as the cost of correctness.
- **Easy to forget** — a developer writing a new provider might use the
  implicit pattern out of habit. Mitigated by:
  - Code review (reviewers should flag implicit injection).
  - The smoke CI job catches the resulting `undefined` at runtime.
  - A future ESLint rule could enforce this automatically (see
    "Compliance" below).
- **Imports get longer** — `@Inject` must be imported from
  `@nestjs/common` in every file with constructor injection.

### Neutral

- The `emitDecoratorMetadata: true` flag in
  `packages/tsconfig/nestjs.json` can stay. It's harmless — tsc still
  emits the metadata for production builds via `nest build`, and the
  explicit `@Inject` decorators are also valid under tsc (they just
  duplicate what the metadata would have provided). Removing the flag
  would break any code that relies on implicit injection (none should
  exist after this ADR is fully adopted, but removing it now would
  cause churn).

## Alternatives Considered

### (a) Switch to swc compiler with `@swc/cli`

swc supports `emitDecoratorMetadata` (it's enabled via
`jsc.transform.decoratorMetadata: true` in `.swcrc`). Switching from
tsx to swc would preserve the implicit-injection pattern.

**Rejected because**:
- Adds a build dependency (swc + its config file + maintenance).
- swc's ESM loader story is less mature than tsx's; the project would
  need `@swc/register` or similar, which has its own quirks.
- The implicit-injection pattern is fragile — it depends on a
  non-standard TypeScript feature that may not survive future
  TypeScript or NestJS versions. Explicit `@Inject` is more defensive.
- The speed difference between tsx and swc is negligible for the
  project's codebase size (both cold-start in <2s).

### (b) Use `nest start --watch` with tsc

tsc emits `emitDecoratorMetadata` by default (when the flag is `true`
in tsconfig). Switching from tsx to `nest start --watch` would preserve
the implicit-injection pattern.

**Rejected because**:
- Slower than tsx (5-10s cold start vs 1s on the Phase 5 codebase).
- tsc doesn't resolve workspace `.ts` imports directly — would require
  pre-building each `@clinic-saas/*` package or running multiple
  watchers in parallel.
- Same fragility concern as (a) — implicit injection depends on
  metadata reflection.

### (c) Keep relying on metadata and only use tsc

The project could mandate tsc for all dev work and accept the slower
bootstrap.

**Rejected because**:
- Dev-mode HMR with tsc is materially worse DX (5-10s restart vs 1s).
- Doesn't solve the underlying fragility — a future contributor who
  tries tsx (because it's faster) would silently break DI.

### (d) Custom ESLint rule to enforce `@Inject`

A custom ESLint rule could flag `constructor(private readonly X)`
without `@Inject(X)`.

**Adopted in PR #41 (Task 25)** — see the "Compliance" section above.
The rule `clinic-saas/require-inject` is registered in
`packages/eslint-config/flat-config.js` and fires on every constructor
in NestJS-decorated classes. A workable generic rule was not found in
the ecosystem (`eslint-plugin-nestjs` is not maintained;
`@nestjs/eslint-plugin` does not exist on npm), so the rule is
project-local, defined in `packages/eslint-config/plugin.js`.

## Compliance

### Enforcement mechanisms

1. **Custom ESLint rule** — `clinic-saas/require-inject` (added in PR #41
   per Task 25). The rule is registered in
   `packages/eslint-config/flat-config.js` and enabled whenever
   `{ nest: true }` is passed to `createConfig()` (i.e. for `apps/api`
   and `apps/worker`). It walks every `MethodDefinition[kind='constructor']`
   in classes with a class-level decorator and flags any constructor
   parameter that has a TypeScript type annotation but no `@Inject(Token)`
   decorator and no request-scoped NestJS parameter decorator
   (`@Req`, `@Res`, `@Body`, `@Query`, `@Param`, `@Headers`, `@Session`,
   `@HostParam`, `@Ip`, `@UploadedFile`, `@UploadedFiles` — these are
   resolved by the framework's router, not the DI container, so they
   don't need `@Inject`). This is the **proactive** enforcement layer —
   it catches the bug at lint time, before the code is committed.

   The rule lives at
   [`packages/eslint-config/plugin.js`](../../packages/eslint-config/plugin.js)
   (see the file's header comment for the full AST-walking rationale).
   Per-line disable is possible via
   `// eslint-disable-next-line clinic-saas/require-inject` (document
   why in a comment); per-file disable via
   `/* eslint-disable clinic-saas/require-inject */` (only for test
   fixtures that intentionally exercise the broken pattern).

2. **Code review** — reviewers should still flag any new constructor
   with injected params that lacks `@Inject(Token)`. The
   [review-session runbook](../runbooks/ai-agent-pr-review.md) lists
   this as a checklist item. The ESLint rule is the first line of
   defense; review is the second.

3. **The smoke CI job** — `tests/smoke/phase5-auth-smoke.sh` boots the
   API via tsx and exercises the auth flow. If a provider's
   constructor injection is `undefined` at runtime, the smoke test
   fails immediately (the API either refuses to boot or 500's on the
   first request). This is the **reactive** safety net — it catches
   the bug after the code is written but before it reaches `main`.

4. **Documentation** — `AGENTS.md` and `CONTRIBUTING.md` both
   reference this ADR as the source of truth for the convention.

### Why a custom rule was needed

The `eslint-plugin-nestjs` package is unmaintained (last publish
2022, doesn't support ESLint 9+ flat config). The `@nestjs/eslint-plugin`
does not exist on npm. ESLint's built-in `no-restricted-syntax` rule
matches PRESENCE of a pattern, not ABSENCE — it cannot express
"constructor parameter with a type annotation but WITHOUT an
`@Inject` decorator" because that requires checking the absence of a
sibling decorator node.

The custom rule in `packages/eslint-config/plugin.js` solves this by
walking the AST directly: it visits every `MethodDefinition` node
with `kind === 'constructor'`, normalizes each parameter node
(handling `TSParameterProperty`, `FormalParameter`, `Identifier`,
`AssignmentPattern`, and `RestElement` shapes), and reports any
parameter that has a type annotation but neither an `@Inject` nor a
request-scoped decorator.

### Existing code

As of PR #39, all four constructor-injected providers in the repo
have explicit `@Inject`:

- `apps/api/src/health.controller.ts` — `@Inject(HealthService)` (PR #37)
- `apps/api/src/modules/auth/permissions.guard.ts` — `@Inject(Reflector)` (PR #37)
- `apps/api/src/infrastructure/rls/tenant.interceptor.ts` — `@Inject(Reflector)` (PR #37)
- `apps/worker/src/health.controller.ts` — `@Inject(HealthService)` (PR #39, this PR)

The `audit.interceptor.ts` and `egress.guard.ts` use `new Logger(...)`
directly (no DI) — they don't need `@Inject`.

The `auth.controller.ts` `AuthController` class uses `@Req`, `@Res`,
and `@Body` parameter decorators on its handler methods (not the
constructor) — these are request-scoped, so the rule correctly
exempts them.

## References

- [esbuild FAQ: Metadata](https://esbuild.github.io/api/#metadata) —
  esbuild's documentation of the `emitDecoratorMetadata` limitation.
- [NestJS DI Fundamentals](https://docs.nestjs.com/providers#dependency-injection) —
  the official docs on constructor-based injection and `@Inject(Token)`.
- [WORKLOG.md Task 23](../../WORKLOG.md) — root-cause analysis of the
  PR #37 DI bugs (esbuild + missing metadata).
- [WORKLOG.md Task 24](../../WORKLOG.md) — original adoption of this
  ADR + the smoke CI job that catches DI bugs at runtime.
- [WORKLOG.md Task 25](../../WORKLOG.md) — added the
  `clinic-saas/require-inject` ESLint rule as the proactive enforcement
  layer.
- [ADR-004](./ADR-004.md) — Better Auth + Organization plugin (the
  source of the auth-related providers).
- [ADR-002](./ADR-002.md) — modular monolith (the architecture that
  NestJS DI serves).
- [`packages/tsconfig/nestjs.json`](../../packages/tsconfig/nestjs.json) —
  the NestJS tsconfig that still has `emitDecoratorMetadata: true`
  (harmless under tsc; ignored by esbuild).
- [`packages/eslint-config/plugin.js`](../../packages/eslint-config/plugin.js) —
  the custom ESLint rule that enforces this ADR at lint time.
