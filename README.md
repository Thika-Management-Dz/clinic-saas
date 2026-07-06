# Clinic Management SaaS

**Multi-clinic, bilingual (Arabic RTL + French LTR), offline-first, fully self-hostable Electronic Medical Record & practice-management SaaS for Algeria**, compliant with Algerian data-protection Law 18-07 (amended by Law 25-11) and health-records Law 18-11.

Target geography: Algeria (Algiers, Oran, Constantine). Hosting model: fully self-hosted on Algerian sovereign infrastructure (local clinic server + offsite encrypted backup; sovereign cloud as optional DR).

> **AI agents: read [`AGENTS.md`](./AGENTS.md) before writing any code.** It is the single source of truth for build commands, architecture rules, i18n/RTL rules, and the Do-NOT list.

## Status

Build-Ready. Architecture, data model, regulatory analysis, and phased MVP scope are specified in the [Technical Blueprint v2.0](./docs/blueprint-v2.0.md). The atomic, step-by-step delivery plan is in the [Atomic Delivery Roadmap v2.1](./docs/roadmap-v2.1.md).

## Reference Stack

Turborepo · pnpm · Next.js 16 PWA (App Router) · NestJS modular monolith · PostgreSQL 17 + Row-Level Security · Drizzle ORM · Better Auth (Organization plugin) · tRPC v11 · Dexie→PowerSync · Serwist · Orthanc · Socket.IO + Redis adapter.

## Prerequisites

- Node.js 24 LTS (v24.18.0)
- pnpm 11.10.0 (via Corepack)
- Docker 27+ (Postgres 17, Orthanc for imaging dev)
- Git 2.45+

## Setup

```bash
# Phase 1 — toolchain (one-time per sandbox)
./scripts/setup-workstation.sh
./scripts/verify-workstation.sh
cp .env.example .env.local && $EDITOR .env.local   # fill in tokens

# Phase 3+ — install workspace deps and run
pnpm install
pnpm dev          # starts web + api + worker via Turborepo
```

See [`docs/runbooks/workstation-setup.md`](./docs/runbooks/workstation-setup.md) for the full workstation setup procedure.

## Testing

```bash
pnpm test         # Vitest unit/integration
pnpm test:e2e     # Playwright end-to-end
pnpm lint
pnpm typecheck
```

## Workspace Layout

Turborepo + pnpm workspaces. Phase 3 (Monorepo Scaffold) introduces the
following structure; subsequent phases fill in the implementation.

```
clinic-saas/
├── apps/
│   ├── web/              # Next.js 16 PWA (App Router) — @clinic-saas/web
│   ├── api/              # NestJS modular monolith (Fastify) — @clinic-saas/api
│   ├── worker/           # NestJS + BullMQ (crons, reconciliation) — @clinic-saas/worker
│   └── patient-portal/   # Stub, reserved for Phase 12+ — @clinic-saas/patient-portal
├── packages/
│   ├── tsconfig/         # Shared tsconfig presets — @clinic-saas/tsconfig
│   ├── eslint-config/    # Shared ESLint flat config — @clinic-saas/eslint-config
│   ├── db/               # Drizzle ORM schema + migrations — @clinic-saas/db
│   ├── auth/             # Better Auth wrapper — @clinic-saas/auth
│   ├── ui/               # shadcn/ui component library — @clinic-saas/ui
│   ├── i18n/             # next-intl messages + config — @clinic-saas/i18n
│   └── contracts/        # tRPC routers + Zod schemas — @clinic-saas/contracts
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── tsconfig.base.json    # (added in Phase 3 PR B via packages/tsconfig)
```

Apps import from `packages/*` via `workspace:*` dependencies. Cross-package
imports use the package's public API (`src/index.ts`) only — internal imports
are blocked by `eslint-plugin-import` `no-internal-modules` (per Blueprint §7.4).

## Documentation

- [Technical Blueprint v2.0](./docs/blueprint-v2.0.md) — authority on architecture & data model
- [Atomic Delivery Roadmap v2.1](./docs/roadmap-v2.1.md) — authority on execution order
- [AGENTS.md](./AGENTS.md) — universal AI-agent instruction file
- [Architecture Decision Records](./docs/adr/) — ADR-001 … ADR-010
- [Conventions](./docs/conventions/) — testing, i18n, RTL, naming
- [Domain Glossary](./docs/domain/glossary.md) — trilingual (FR/AR/EN) terminology source of truth
- [Runbooks](./docs/runbooks/) — breach response, backup recovery, Dexie→PowerSync migration
- [DPIA](./docs/dpia.md) — Data Protection Impact Assessment (to complete before go-live)

## Regulatory Context

Patient-identifiable health data must reside in Algeria (Law 18-07). ANPDP prior authorization is required for processing health data; cross-border transfers require separate authorization. The audit log is append-only and hash-chained (6-year retention). Clinical records use soft deletes only (20-year retention). See the blueprint §3 for the full regulatory framework.

## License

MIT during development. Will switch to Elastic License 2.0 or BUSL-1.1 before commercial launch — see [ADR-009](./docs/adr/ADR-009.md).
