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
pnpm install
pnpm dev          # starts web + api + worker via Turborepo
```

## Testing

```bash
pnpm test         # Vitest unit/integration
pnpm test:e2e     # Playwright end-to-end
pnpm lint
pnpm typecheck
```

## Documentation

- [Technical Blueprint v2.0](./docs/blueprint-v2.0.md) — authority on architecture & data model
- [Atomic Delivery Roadmap v2.1](./docs/roadmap-v2.1.md) — authority on execution order
- [AGENTS.md](./AGENTS.md) — universal AI-agent instruction file
- [Architecture Decision Records](./docs/adr/) — ADR-001 … ADR-009
- [Conventions](./docs/conventions/) — testing, i18n, RTL, naming
- [Domain Glossary](./docs/domain/glossary.md) — trilingual (FR/AR/EN) terminology source of truth
- [Runbooks](./docs/runbooks/) — breach response, backup recovery, Dexie→PowerSync migration
- [DPIA](./docs/dpia.md) — Data Protection Impact Assessment (to complete before go-live)

## Regulatory Context

Patient-identifiable health data must reside in Algeria (Law 18-07). ANPDP prior authorization is required for processing health data; cross-border transfers require separate authorization. The audit log is append-only and hash-chained (6-year retention). Clinical records use soft deletes only (20-year retention). See the blueprint §3 for the full regulatory framework.

## License

MIT during development. Will switch to Elastic License 2.0 or BUSL-1.1 before commercial launch — see [ADR-009](./docs/adr/ADR-009.md).
