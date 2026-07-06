From Zero to Production

An Atomic Roadmap for Building the Clinic Management SaaS

Vibe-Coder Edition — AI-Agent Workflow over GitHub, $0 Ongoing Budget

Reference Stack: Turborepo · pnpm · Next.js 16 PWA · NestJS · PostgreSQL
17 + RLS · Drizzle · Better Auth · tRPC · Dexie→PowerSync · Orthanc
Target Geography: Algeria (local clinic server + offsite backup;
sovereign cloud as optional DR)

Companion to: Clinic Management SaaS Technical Blueprint v2.0

Atomic Delivery Roadmap · Version 2.1 · 2026-07-06

Genre: Technical Documentation | Writing Mode: In-Depth Research

Table of Contents

  Document Overview & Conventions

  Opening Hook

  Background & Context — Project, $0 Budget Reality, AI-Agent Workflow
  Model

  Phase 0 — GitHub Account & Organization Setup

  Phase 1 — Developer Workstation & Tooling

  Phase 2 — Repository Foundation (AGENTS.md, ADRs, Governance)

  Phase 3 — Monorepo Scaffold (Turborepo + pnpm)

  Phase 4 — Local Database & RLS Foundation

  Phase 5 — Authentication & Tenant Interceptor

  Phase 6 — RTL/i18n Scaffold (ar-DZ + fr-DZ)

  Phase 7 — CI/CD Pipeline on GitHub Actions (Free Tier)

  Phase 8 — Testing Foundations (Vitest + Playwright + MSW + axe-core)

  Phase 9 — PWA & Offline-First (Serwist + Dexie + Sync Outbox)

  Phase 10 — Core Domain Modules (Patient, Encounter, Dental,
  Appointment, Billing)

  Phase 11 — Algerian Integrations (Chargily Pay, SMS, E-Invoicing
  Schema)

  Phase 12 — Observability on Free Tiers (Sentry, PostHog, Better Stack,
  Grafana Cloud)

  Phase 13 — Security & Compliance Hardening (CSP, PII Scrubbing, RLS
  Tests, Audit Integrity)

  Phase 14 — Pre-Production Hardening (k6 Load Test, Accessibility
  Audit, DR Drill)

  Phase 15 — Local Clinic Server Setup (Primary Production Path)

  Phase 16 — Production Cutover (Migration, Deploy, Smoke Test, 24h
  Soak)

  Phase 17 — Post-Deployment Operations & ANPDP Compliance

  Counterarguments & Limitations

  Conclusion & Implications

  References

Document Overview & Conventions

This document is the atomic, step-by-step delivery companion to the
Clinic Management SaaS Technical Blueprint v2.0. It picks up where the
blueprint stops: the blueprint specifies the architecture, the data
model, the regulatory constraints, and the phased MVP scope; this
roadmap specifies, in reproducible atomic steps, how a single operator
using AI coding agents on a $0 development budget takes the project from
absolute zero — no GitHub account, no local toolchain, no cloud
credentials — to a production deployment on Algerian sovereign
infrastructure that is legally compliant with Law 18-07 (amended by Law
25-11) and Law 18-11.

Every step is written as a single, verifiable action. Every command is
version-pinned to the latest stable release verified on 2026-07-06.
Every phase ends with a verification gate that must be observed before
the next phase begins. The roadmap is designed to be executed by a vibe
coder — a developer who writes high-level specifications and delegates
implementation to AI agent sessions collaborating over the GitHub
repository — but every step is concrete enough that a human following it
manually would produce the same result.

Conventions

-   Atomic steps are numbered within each phase (e.g., 0.1, 0.2, 0.3.1).
    Each step performs exactly one verifiable action.

-   Shell commands assume a POSIX shell (bash/zsh) on macOS or Linux, or
    WSL2 on Windows. PowerShell-specific steps are marked [PowerShell].

-   Code blocks are tagged with their language and intended to be copied
    verbatim unless a placeholder like <your-org> is shown.

-   Callout boxes mark Critical (red), Warning (amber), and Note (blue)
    information that constrains or modifies surrounding steps.

-   Every phase ends with a Verification subsection — a concrete command
    or observation proving the phase is complete.

-   The notation [Blueprint §X] refers to the corresponding section in
    the source Technical Blueprint v2.0; the blueprint is the authority
    on architecture decisions, this roadmap is the authority on
    execution order.

The $0 Budget Reality — Read This First

$0 ongoing budget is achievable end-to-end, including production. The
free tiers available in mid-2026 (GitHub Free, Vercel Hobby, Neon Free,
Sentry Developer, PostHog Cloud Free, Better Stack Free, Grafana Cloud
Free, Resend Free, Upstash Redis Free, Inngest Free, Doppler Free,
Cloudflare Free) cover the entire development and staging environment
with zero out-of-pocket cost. For production, the local clinic-server
topology (Phase 15) eliminates the ~€640/month sovereign-cloud VPS bill
entirely: a one-time hardware outlay of ~€1,000–1,500 (mini-PC, UPS,
encrypted HDDs) plus ~€10–35/month for offsite backup (CERIST S3 or
second-clinic HDD rotation) is the total production running cost.
Optional DR via a single CERIST VPS Small adds ~€20/month.

+-----------------------------------------------------------------------+
| Note — One-time hardware cost is the only material outlay             |
|                                                                       |
| Algerian Law 18-07 mandates that patient-identifiable health data     |
| reside in Algeria; it does NOT mandate that the data reside on a      |
| cloud provider. A server physically located in the clinic satisfies   |
| the residency requirement. The local clinic-server topology (Phase    |
| 15) brings the production running cost to near-zero — the only        |
| material outlay is the one-time hardware (~€1,000–1,500) and an       |
| optional CERIST VPS for warm DR (~€20/month). The multi-VPS           |
| sovereign-cloud topology from the source blueprint §6.3 (~€640/month) |
| remains available as an alternative for operators who prefer managed  |
| infrastructure; it is documented briefly at the end of Phase 15.      |
+=======================================================================+
+-----------------------------------------------------------------------+

Opening Hook

A clinic in Algiers still runs on paper. Two clinics, actually — one
dental, one mixed medical and dental — and every appointment, every
prescription, every invoice is written by hand, filed in a cabinet, and
lost within a year. The operator knows this is unsustainable; the
regulator (ANPDP, under Law 25-11 of July 2025) increasingly agrees; the
patients, who occasionally need a record reconstructed from memory, bear
the cost. The ambition is to replace this with a bilingual,
offline-first, multi-tenant Electronic Medical Record that works on a
tablet in the chair, survives a four-hour power cut, and is auditable
six years later. The operator is a clinician, not a software engineer,
but intends to build it anyway — with AI agents as the workforce and a
GitHub repository as the workshop.

Thesis: a single operator using AI coding agents, working on a $0
development budget, can deliver a Law-18-07-compliant,
Algerian-sovereign-hosted clinic SaaS from empty repository to
production cutover in 17 sequenced phases, each composed of atomic,
verifiable steps. The discipline is not heroic — it is mechanical. Every
architectural decision is already made in the source blueprint; every
tool is free for development; every step has a verification gate. The
cost is roughly 8–12 weeks of focused part-time work and the willingness
to follow the checklist literally. The payoff is a clinic that runs on
software the operator owns, on infrastructure the Algerian government
accepts, with audit trails the ANPDP can inspect.

Background & Context

Project Identity

The system is a multi-clinic, bilingual (Arabic RTL + French LTR),
offline-first, fully self-hostable EMR and practice-management SaaS
tailored to the Algerian regulatory and technical environment. It serves
two clinics at launch — one dental-only, one mixed medical and dental —
with architectural headroom for fifty. Patient volume is approximately
120 encounters per clinic per day. There is no fixed delivery deadline,
which favors correctness over speed. The full architectural rationale,
data model, regulatory analysis, and counterarguments are in the source
blueprint; this roadmap does not re-litigate them.

Key Definitions

-   Vibe coder — a developer who writes high-level specifications and
    delegates implementation to AI coding agents, reviewing and
    integrating their output rather than writing every line personally.

-   AI agent session — a single invocation of an AI coding tool against
    a task, producing a diff or a pull request. The specific tool is the
    operator's choice; this roadmap is tool-agnostic and governs the
    workflow via AGENTS.md and repo conventions.

-   AGENTS.md — a universal instruction file at the repository root,
    read by every AI coding tool that respects the 2025–2026 convention,
    that defines build commands, architecture rules, testing
    conventions, i18n/RTL rules, and a Do-NOT list. It is the single
    source of truth for agent context.

-   Issue-as-spec — a GitHub Issue whose body is a complete,
    self-contained task specification (user story, acceptance criteria,
    file paths, test expectations) that an AI agent can pick up cold
    without additional context.

-   Sovereign infrastructure — compute, storage, and network physically
    located in Algeria and operated by an ARPCE-authorized provider
    (CERIST Cloud, Djezzy Cloud, Algérie Télécom DC). Required for
    patient-identifiable data under Law 18-07.

-   ANPDP — Autorité Nationale de Protection des Données à caractère
    Personnel; the Algerian data protection authority. Prior
    authorization is required for processing health data; cross-border
    transfers require separate authorization.

Scope of This Roadmap

In scope: GitHub account creation, local toolchain, AI agent tooling,
repository governance, monorepo scaffold, local database with RLS,
authentication, RTL/i18n, CI/CD, testing, PWA offline layer, core domain
modules (patient, encounter, dental, appointment, billing), Algerian
integrations (Chargily Pay, SMS, e-invoicing schema), observability on
free tiers, security hardening, pre-production testing, Algerian
sovereign infrastructure provisioning, production cutover, and the first
30 days of operations including ANPDP compliance.

Out of scope: clinical content design (treatment protocols, drug
formularies), business operations (pricing, marketing, sales), the
operator's specific AI agent orchestration tooling (the source blueprint
explicitly defers this), advanced imaging workflows beyond the MVP
scope, CNAS/CASNOS electronic billing (no public API exists), FHIR
export (Phase 10 of the blueprint, deferred), patient portal (Phase 12+
of the blueprint, deferred), and telemedicine (Phase 13+, deferred).
These are roadmap extensions once the MVP is in production.

The AI-Agent Workflow Model

The roadmap assumes the operator's working pattern is: write a
specification as a GitHub Issue, hand the issue to an AI coding agent
running on a feature branch, review the agent's pull request, merge if
it passes CI and an AI PR-review bot approves. The operator never types
code into the editor unless fixing a specific bug the agents cannot. The
roadmap is structured to make this loop productive: every phase produces
one or more GitHub Issues written as self-contained specs, and every
atomic step is small enough that a single agent session can complete it.

The single most important governance artifact for this workflow is
AGENTS.md. It is read by every AI coding tool that respects the emerging
2025–2026 convention. When AGENTS.md is comprehensive and current,
agents produce code that respects the architecture (RLS on every tenant
table, soft deletes only, next-intl for every string, Tailwind logical
properties for every layout) without being told each time. When
AGENTS.md is thin or stale, agents produce plausible-looking code that
violates the architecture — and the violations compound. Phase 2 invests
heavily in AGENTS.md for this reason.

Verified Tool Versions and Free-Tier Limits (2026-07-06)

  -----------------------------------------------------------------------
  Component               Verified Version / Free Role in Roadmap
                          Tier                    
  ----------------------- ----------------------- -----------------------
  Node.js LTS             v24.18.0 (Krypton)      Local runtime;
                                                  Vercel/Cloudflare build

  pnpm                    11.10.0 (Corepack)      Monorepo package
                                                  manager

  GitHub Free             Private: 2000 Actions   Repo + CI; choose
                          min/mo, 500MB Packages; public for unlimited CI
                          Public: unlimited       during dev
                          Actions                 

  GitHub Pro              $4/mo (not used in $0   Upgrade path if private
                          path)                   CI minutes run out

  Vercel Hobby            100GB bandwidth,        Dev/staging previews;
                          100GB-hrs functions,    not for production
                          commercial use allowed  

  Neon Free               0.5GB DB, 191.9         Dev/staging Postgres;
                          compute-hrs/mo, 10      local Docker for parity
                          branches, autosuspend   
                          5d                      

  Supabase Free           500MB DB, 50k MAU, 1GB  Alternative dev DB; not
                          storage, 2 projects     used (Better Auth is
                                                  self-hosted)

  Cloudflare Free         Workers 100k req/day,   DNS, WAF, tunnel for
                          Pages unlimited, R2     local webhook testing
                          10GB                    

  Sentry Developer        5,000 errors/mo, 50     Error tracking
                          replays/mo, 1 user      dev/staging/prod

  PostHog Cloud Free      1M events/mo, 5k        Product analytics
                          recordings, 1 project   dev/staging

  Better Stack Free       10 monitors, 1 status   Uptime monitoring
                          page, 3 on-call seats   dev/staging/prod

  Grafana Cloud Free      3 dashboards, 10k       Metrics/logs/traces
                          series, 50GB logs, 50GB dev/staging
                          traces                  

  Resend Free             3,000 emails/mo,        Dev email (appointment
                          100/day, 1 domain       reminders)

  Brevo Free              300 emails/day,         Alternative dev email
                          unlimited contacts      

  Upstash Redis Free      10k commands/day, 256MB Rate limiting +
                          max DB                  Socket.IO adapter dev

  Inngest Free            25k function runs/mo    Background jobs dev
                                                  (SMS, reminders,
                                                  backups)

  Doppler Free            Personal: unlimited     Secrets management
                          configs, 5 users        dev/staging/prod

  Cloudflare Free         DNS + WAF + Tunnel + R2 DNS, WAF, tunnel (no
                          10GB                    inbound ports), DDoS
                                                  protection

  Next.js                 16.2.10                 Frontend PWA (App
                                                  Router)

  NestJS                  11.x (current)          Backend modular
                                                  monolith (Fastify
                                                  adapter)

  Drizzle ORM             latest (Apache-2.0)     Plain-TS schema, native
                                                  RLS support

  Better Auth             latest (MIT)            Self-hosted auth with
                                                  Organization plugin

  tRPC                    v11                     Type-safe API contracts

  Playwright              1.61.1                  E2E tests

  Vitest                  4.1.10                  Unit/integration tests

  Serwist                 latest (MIT)            Service worker (Workbox
                                                  successor)

  Dexie.js                latest (Apache-2.0)     IndexedDB wrapper for
                                                  offline-first

  Orthanc                 latest Docker image     DICOM server; local
                          (GPLv3)                 Docker for dev

  pgBackRest              latest (MIT)            Backup with AES-256-CBC
                                                  encryption

  CERIST Cloud S3 (prod   ~€10/month for 100GB    Offsite encrypted
  backup)                                         backup target
                                                  (Algerian,
                                                  ARPCE-authorized)

  CERIST Cloud VPS Small  ~€20/month, 2 vCPU 4GB  Optional warm DR
  (optional DR)                                   standby (Postgres
                                                  streaming replica)

  AI agent tooling        Operator's choice       Workflow governed by
                          (tool-agnostic)         AGENTS.md regardless of
                                                  provider
  -----------------------------------------------------------------------

Phase 0 — GitHub Account & Organization Setup

Before any code is written, the GitHub account and organization must
exist. This phase assumes the operator has no GitHub account. If one
already exists, skip to step 0.5. The choices made here — organization
name, repository visibility, two-factor enforcement — are difficult to
change later; take the time to get them right.

0.1 — Create the GitHub Account

0.1.1 Navigate to github.com/signup. Use the operator's professional
email (not a clinic-branded email yet — that comes when the organization
is created). Choose a username that is stable and professional; it will
appear in commit URLs permanently.

0.1.2 Choose the Free plan. The Free plan is sufficient for the entire
development phase; Pro ($4/mo) is only needed if private-repo Actions
minutes run out, which the $0 path avoids by using a public repo for
development (see 0.4.3).

0.1.3 Enable two-factor authentication immediately: Settings → Password
and authentication → Two-factor authentication → use an authenticator
app (Authy, 1Password, Google Authenticator). Do not use SMS 2FA — SIM
swaps make it vulnerable.

0.2 — Create the GitHub Organization

0.2.1 Navigate to github.com/organizations/plan. Choose Free. Name the
organization after the operating entity (e.g., clinic-saas-dz or the
operator's brand). The name is permanent in URLs.

0.2.2 In Settings → Authentication security, enforce 2FA for all
members. This is non-negotiable; do not skip even for a solo team.

0.2.3 In Settings → Member privileges, set Default repository permission
to Read, and disable Members can create repositories (force all repos to
be created by owners). This prevents shadow repositories.

0.3 — Install the GitHub CLI

0.3.1 Install GitHub CLI: macOS (brew install gh), Windows (winget
install GitHub.cli), Linux (per github.com/cli/cli#installation).
Verify: gh --version (expect 2.65+).

0.3.2 Authenticate: gh auth login — choose GitHub.com, HTTPS,
authenticate via browser. Verify: gh auth status must show 'Logged in to
github.com as <you>'.

0.4 — Create the Repository

0.4.1 Create the repository: gh repo create <org>/clinic-saas --public
--description "Multi-clinic, bilingual, offline-first EMR for Algeria"
--homepage https://clinic-saas.example.dz. Use --public for unlimited
GitHub Actions minutes during development.

0.4.2 If the operator is unwilling to expose the code publicly during
development (competitor concern), use --private instead and accept the
2000 Actions-minutes/month limit. The $0 path still works for a solo
developer at this scale; upgrade to Pro ($4/mo) only if CI runs out.

0.4.3 Clone the empty repository: gh repo clone <org>/clinic-saas && cd
clinic-saas. The local working copy is now ready.

0.4.4 Confirm the default branch is main: git branch --show-current. If
it shows master, rename: git branch -m master main && git push -u origin
main.

0.5 — Configure Organization-Level Rulesets

0.5.1 In the repository Settings → Rules → Rulesets, click New ruleset →
New branch ruleset. Name it 'main-protection'. Target: include default
branch (main). Enforcement: Active.

0.5.2 Under 'Require a pull request before merging', set required
approvals to 1, require code owner review = on, require conversation
resolution = on. For a solo operator using AI agents, the '1 approval'
is satisfied by the operator's own review of the agent's PR.

0.5.3 Under 'Require status checks to pass', add: ci, lint, typecheck,
test, build, e2e, lighthouse, accessibility (these workflow names are
created in Phase 7). Enable 'Require branches to be up to date before
merging'.

0.5.4 Enable 'Require signed commits' (sigstore or GPG). Enable 'Require
linear history'. Under 'Bypass list', add no one for the first 90 days;
force-push and deletion must be blocked for everyone, including admins.

0.5.5 Create a second ruleset 'tag-protection' targeting tags matching
v*; restrict tag creation to the operator. This prevents accidental
version-tag pushes.

Phase 0 — Verification

On github.com, confirm the organization exists, 2FA is enforced, the
repository is cloned locally, the default branch is main, and two active
rulesets (main-protection, tag-protection) are visible in Settings →
Rules → Rulesets. Attempt git push origin main directly from a feature
branch context — it must be rejected with a ruleset error.

+-----------------------------------------------------------------------+
| Warning — Legacy branch protection is deprecated                      |
|                                                                       |
| GitHub has frozen legacy Branch Protection Rules; new repos can only  |
| view them read-only. Use Rulesets (Settings → Rules → Rulesets) for   |
| all branch governance. The API and UI for legacy protection will not  |
| receive new features.                                                 |
+=======================================================================+
+-----------------------------------------------------------------------+

Phase 1 — Developer Workstation & Tooling

Every developer who will commit code — in this case the operator and any
AI agent running on their machine — must complete this phase
identically. Toolchain drift is the leading cause of 'works on my
machine' defects and is fully preventable by pinning versions. This
phase also installs the AI agent tools that constitute the operator's
primary workforce.

1.1 — Install Node.js 24 LTS

1.1.1 Install a Node version manager. On macOS/Linux: curl -o-
https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash.
On Windows use WSL2 (Ubuntu 24.04) and the same command, or install fnm
via winget install Schniz.fnm for native Windows.

1.1.2 Restart the shell, verify nvm: nvm --version (expect 0.40.1+).

1.1.3 Install Node 24: nvm install 24.18.0 && nvm alias default 24.18.0.
On fnm: fnm install 24.18.0 && fnm default 24.18.0.

1.1.4 Verify: node --version must print v24.18.0 and npm --version must
print 11.17.0+.

1.2 — Enable Corepack and Pin pnpm

1.2.1 Enable Corepack (shipped with Node 24): corepack enable.

1.2.2 Prepare pnpm at the pinned version: corepack prepare pnpm@11.10.0
--activate.

1.2.3 Verify: pnpm --version must print 11.10.0.

1.3 — Install Git and Configure Identity

1.3.1 Install Git: macOS (brew install git), Windows (winget install
Git.Git), Linux (sudo apt-get install -y git). Verify: git --version
(expect 2.45+).

1.3.2 Configure identity: git config --global user.name "<Your Name>"
and git config --global user.email "<you@yourdomain>". Use the same
email as the GitHub account.

1.3.3 Set defaults: git config --global init.defaultBranch main, git
config --global color.ui auto, git config --global pull.rebase true.

1.3.4 Configure commit signing (sigstore is easiest): follow
github.com/github/opensource.guide/blob/main/articles/signing-with-sigstore.md.
Verify: git config --global commit.gpgsign true is NOT needed for
sigstore; instead install gitsign (go install
github.com/sigstore/gitsign@latest) and configure per the gitsign
README.

1.4 — Install Docker

1.4.1 Install Docker Desktop: macOS (brew install --cask docker),
Windows (winget install Docker.DockerDesktop — requires WSL2), Linux
(per docs.docker.com/engine/install).

1.4.2 Launch Docker Desktop, complete first-run setup. Verify: docker
--version (expect 27+) and docker run hello-world (must print 'Hello
from Docker!').

1.4.3 Allocate at least 4 GB RAM and 2 CPUs to Docker Desktop (Settings
→ Resources). Insufficient resources cause Postgres and Orthanc to crash
under parity-test load.

1.5 — Install VS Code and the Extension Pack

1.5.1 Install VS Code: macOS (brew install --cask visual-studio-code),
Windows (winget install Microsoft.VisualStudioCode), Linux (download
.deb from code.visualstudio.com).

1.5.2 Install the required extension pack from the command line: code
--install-extension dbaeumer.vscode-eslint && code --install-extension
esbenp.prettier-vscode && code --install-extension
bradlc.vscode-tailwindcss && code --install-extension prisma.prisma &&
code --install-extension ms-playwright.playwright && code
--install-extension GitHub.vscode-pull-request-github. (The operator may
add their chosen AI coding tool's VS Code extension separately.)

1.5.3 Confirm Tailwind CSS v4 IntelliSense by opening any .css file
containing @import "tailwindcss"; hover a utility class — a tooltip must
appear.

1.6 — Install Infrastructure CLIs

1.6.1 Install Vercel CLI: npm install -g vercel@54.20.1. Verify: vercel
--version.

1.6.2 Install Doppler CLI: macOS (brew install
dopplerhq/doppler/doppler), Linux (curl -Ls
https://git.io/install-doppler | sh), Windows (scoop install doppler).
Verify: doppler --version (expect 0.5.10+).

1.6.3 Install Cloudflare CLI (wrangler): npm install -g wrangler@latest.
Verify: wrangler --version. Authenticate with a free Cloudflare account:
wrangler login.

1.6.4 Install Sentry CLI: npm install -g @sentry/cli@2.45.0. Verify:
sentry-cli --version.

1.7 — Authenticate All CLIs

1.7.1 Vercel: vercel login — authenticate via GitHub. Verify: vercel
whoami.

1.7.2 Doppler: doppler login — open browser, approve. Create a workplace
project named clinic-saas. Verify: doppler me.

1.7.3 Cloudflare: wrangler login — open browser, approve. Verify:
wrangler whoami.

Phase 1 — Verification

Run the following one-liner; every line must print the expected version.
If any fails, re-do the relevant step before proceeding.

  -----------------------------------------------------------------------
  node --version # v24.18.0
  pnpm --version # 11.10.0
  git --version # git version 2.45+
  docker --version # Docker version 27+
  code --version # 1.95+
  gh --version # gh version 2.65+
  vercel --version # 54.20.1
  doppler --version # v0.5.10+
  wrangler --version # wrangler 3.x+
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

Phase 2 — Repository Foundation (AGENTS.md, ADRs, Governance)

This phase creates the governance files that make AI-agent-driven
development safe and productive. The most important artifact is
AGENTS.md — the universal instruction file read by every AI coding tool.
A comprehensive AGENTS.md is the single highest-leverage investment in
the entire roadmap: it converts every subsequent agent session from
'plausible code that violates the architecture' to 'plausible code that
respects the architecture'. The source blueprint's Appendix B contains a
complete sample AGENTS.md; this phase adapts it to the specific
$0-budget, AI-agent workflow.

2.1 — Add Starter Governance Files

2.1.1 Create .gitignore for a
Node/Next.js/NestJS/Docker/macOS/Windows/Linux project. Use
github.com/github/gitignore/blob/main/Node.gitignore as the base, then
append: .env, .env.local, .env.*.local, /coverage, /.next, /dist,
.vercel, .DS_Store, *.pem, /tmp, .turbo.

2.1.2 Create README.md with: project name (Clinic Management SaaS),
one-paragraph description, prerequisites (Node 24, pnpm 11, Docker),
setup commands (pnpm install, pnpm dev), test commands (pnpm test, pnpm
test:e2e), a link to the source blueprint (docs/blueprint-v2.0.md), and
a link to AGENTS.md with the note 'AI agents: read AGENTS.md before
writing any code.'

2.1.3 Create LICENSE. For a SaaS the operator intends to commercialize,
use the Elastic License 2.0 (elastic.co/licensing/elastic-license) or
the Business Source License (BUSL-1.1) — both allow source visibility
while restricting production use. For maximum simplicity, use MIT during
development and switch before commercial launch. Document the choice in
ADR-009.

2.1.4 Create CONTRIBUTING.md describing: branch naming
(agent/<task-id>-<short-desc> for AI work, feat/<task-id> for
human-directed, fix/<task-id> for bugfixes), commit message convention
(Conventional Commits: feat/fix/chore/docs/refactor/perf/test/build/ci),
PR template, and the rule that no PR merges without green CI, one human
review, and a passing AI-PR-review-bot check.

2.2 — Create the .github Directory and Issue Templates

2.2.1 Create .github/CODEOWNERS. For a solo operator: *
@<your-github-handle> on the first line. Add per-area ownership as the
team grows: /packages/db/ @<you>, /apps/api/src/modules/dental/ @<you>,
/docs/adr/ @<you>. Use the ^ prefix on package.json to force
release-manager review on dependency changes.

2.2.2 Create .github/PULL_REQUEST_TEMPLATE.md with sections: Summary,
Motivation, Changes, Test plan, Screenshots/recordings (mandatory for UI
changes), Migration included (Y/N), Breaking change (Y/N),
Self-verification checklist (lint passes, typecheck passes, tests pass,
AGENTS.md rules respected, no PII in logs, no hard-coded strings, no
physical-left/right CSS).

2.2.3 Create .github/ISSUE_TEMPLATE/agent-task.yml — a structured issue
template designed to be picked up by an AI agent. Fields: title
(verb-phrase), user story, acceptance criteria (checkboxes), file paths
to touch, test expectations, AGENTS.md references, out-of-scope. This is
the issue-as-spec format.

2.2.4 Create .github/ISSUE_TEMPLATE/bug-report.yml and
.github/ISSUE_TEMPLATE/feature-request.yml for non-agent-driven issues.

2.3 — Write AGENTS.md (the Universal Agent Instruction File)

2.3.1 Create AGENTS.md at the repository root. Use the source
blueprint's Appendix B as the starting point. The file must contain, at
minimum: Project Overview, Build Commands, Architecture Rules
(Multi-Tenancy, Modular Monolith, Soft Deletes, Audit Logging, Data
Residency), Testing Conventions, i18n Rules, RTL Rules, Code Style,
Domain Glossary reference, ADRs reference, Runbooks reference, Worker
App notes, and a Do-NOT list.

2.3.2 In the Do-NOT list, include the source blueprint's items verbatim:
do NOT use DELETE on tenant-scoped tables (use soft delete via
deleted_at); do NOT auto-apply Drizzle migrations on app boot; do NOT
log patient PII in Sentry or console; do NOT hardcode user-visible text
(use next-intl); do NOT use physical-left/right CSS properties for
layout; do NOT call self.skipWaiting() in the service worker; do NOT
store FHIR JSON internally; do NOT use Universal tooth numbering (use
FDI ISO 3950:2016); do NOT assume Background Sync API works in Safari.

2.3.3 Add an explicit 'AI Agent Workflow' section to AGENTS.md
describing: how to pick up an issue (read the issue body, check the file
paths, ask no clarifying questions — make reasonable assumptions and
document them in the PR description); how to structure the PR (one
commit per logical change, conventional-commit messages, link the issue
with 'Closes #N'); how to self-verify (run pnpm lint && pnpm typecheck
&& pnpm test before pushing); how to handle uncertainty (leave a //
REVIEW: comment rather than guessing silently).

2.4 — Create the docs/ Directory Structure

2.4.1 Create docs/adr/ for Architecture Decision Records. Initialize
with the eight ADRs from the source blueprint: ADR-001 Pool-model
multi-tenancy with RLS (Citus trigger: >200 tenants or >5TB or
P95 >500ms); ADR-002 Modular monolith over microservices; ADR-003
Drizzle over Prisma; ADR-004 Better Auth over Clerk; ADR-005
Dexie+manual-sync for v1, PowerSync for v2; ADR-006 Lean schema + future
national-interop adapter (FHIR as first implementation); ADR-007 FDI
tooth notation only (ISO 3950:2016); ADR-008 Chargily Pay for MVP
payments. Each ADR: Title, Status (Accepted), Context, Decision,
Consequences, Alternatives Considered.

2.4.2 Create docs/conventions/ with testing.md, i18n.md, rtl.md,
naming.md. These are referenced from AGENTS.md and expand on the rules.
Each file is 1–3 pages; concrete examples, not abstract principles.

2.4.3 Create docs/domain/glossary.md — the trilingual glossary (FR +
AR + EN) for patient, appointment, encounter, prescription, odontogram,
invoice, operatory, practitioner, encounter, vitals, allergy,
medication, immunization, etc. This is the source of truth for
terminology; AI agents must use these terms consistently.

2.4.4 Create docs/runbooks/ with breach-response.md (per source
blueprint §11.3 — ANPDP 5-day SLA), backup-recovery.md (pgBackRest
restore procedure), dexie-to-powersync-migration.md (per source §10.4).
Each runbook is a complete step-by-step, not a stub.

2.4.5 Create docs/dpia.md — the Data Protection Impact Assessment stub,
to be completed with the DPO before go-live (Phase 17). Reference: ANPDP
DPIA guidance and Law 25-11 mandatory DPIA for high-risk processing.

2.4.6 Copy the source blueprint itself into docs/blueprint-v2.0.md so
the repository is self-contained and AI agents can reference it.

2.5 — Configure Renovate for Dependency Management

2.5.1 Install the Renovate GitHub App (apps.github.com/app/renovate) on
the organization. Grant access to the clinic-saas repository.

2.5.2 Create .github/renovate.json5: { "$schema":
"https://docs.renovatebot.com/renovate-schema.json", "extends":
["config:recommended", ":semanticCommits", ":dependencyDashboard",
"schedule:earlyMondays"], "timezone": "Africa/Algiers", "rangeStrategy":
"bump", "labels": ["dependencies"], "packageRules": [ {
"matchUpdateTypes": ["minor", "patch"], "groupName": "all non-major",
"automerge": false, "automergeType": "pr" }, { "matchDepTypes":
["devDependencies"], "automerge": false }, { "matchPackageNames":
["next", "react", "react-dom", "drizzle-orm", "@better-auth/..."],
"extends": ["schedule:monthly"], "labels": ["major"] } ],
"vulnerabilityAlerts": { "enabled": true, "labels": ["security"] } }.
Note: automerge is false because every PR needs human review and an
AI-PR-review-bot pass before merge.

2.5.3 Merge the Renovate onboarding PR when it arrives (within an hour
of installation). Confirm the Dependency Dashboard issue appears in the
Issues tab.

2.6 — Install an AI PR Review Bot

2.6.1 Install an AI PR review bot of your choice on the repository. The
bot enforces AGENTS.md rules on every PR and catches architecture
violations before a human review. Several free-tier options exist in
mid-2026 for both public and private repositories; the operator should
evaluate and choose one based on the repo's visibility and the bot's
TypeScript support. The specific provider is the operator's decision;
the workflow (bot reviews every PR, enforces AGENTS.md) is the same
regardless.

2.6.2 Configure the bot via its config file at the repo root (the
filename and format depend on the chosen bot). Set the review language
to TypeScript, review depth to thorough, enable auto-review on PR open,
set path-filters to skip generated files (.next/**, dist/**,
coverage/**, **/*.md). Configure the review prompt to enforce the
AGENTS.md rules: RLS on every tenant-scoped table, soft deletes only,
next-intl for every string, Tailwind logical properties for every
layout, no FHIR JSON internally, FDI tooth notation only.

2.6.3 Verify: open a test PR with a deliberate AGENTS.md violation
(e.g., a hardcoded string, a physical-left CSS property). The bot must
post a review comment flagging the violation within 2 minutes. If it
does not, the config or the prompt is wrong — reconfigure before relying
on the bot.

2.7 — Commit and Push the Foundation

2.7.1 Stage and commit: git add . && git commit -m "chore: repository
foundation (AGENTS.md, ADRs, governance, issue templates)".

2.7.2 Push to a feature branch: git checkout -b chore/repo-foundation &&
git push -u origin chore/repo-foundation. Open a PR via gh pr create
--title "chore: repository foundation" --body "Initial governance files
per Phase 2 of the roadmap."

2.7.3 Observe the AI PR review bot post a review comment on the PR
within 2 minutes. Merge the PR once CI is green (CI is configured in
Phase 7; until then, merge manually since the ruleset requires status
checks that do not yet exist — temporarily relax the ruleset to require
only 'Require a pull request' until Phase 7 completes).

Phase 2 — Verification

On github.com, confirm: README.md, AGENTS.md, LICENSE, CONTRIBUTING.md,
.github/CODEOWNERS, .github/PULL_REQUEST_TEMPLATE.md,
.github/ISSUE_TEMPLATE/agent-task.yml, .github/renovate.json5, and the
AI PR review bot's config file all exist. Confirm docs/adr/ADR-001.md
through ADR-008.md exist. Confirm the Renovate Dependency Dashboard
issue is open. Open a test PR — the AI PR review bot must post a review
within 2 minutes. Confirm the rulesets are active.

Phase 3 — Monorepo Scaffold (Turborepo + pnpm)

This phase creates the runnable monorepo skeleton: a Turborepo + pnpm
workspace with the four apps (web, api, worker, patient-portal-stub) and
seven packages (db, auth, ui, i18n, contracts, tsconfig, eslint-config)
defined in the source blueprint's §15.1. The structure is load-bearing:
undoing it later requires touching hundreds of files.

3.1 — Initialize the pnpm Workspace

3.1.1 From the repository root, create pnpm-workspace.yaml with:
packages: ['apps/*', 'packages/*'].

3.1.2 Create the root package.json: { "name": "clinic-saas", "private":
true, "packageManager": "pnpm@11.10.0", "engines": { "node": ">=24.18.0"
}, "scripts": { "dev": "turbo dev", "build": "turbo build", "lint":
"turbo lint", "typecheck": "turbo typecheck", "test": "turbo test",
"test:e2e": "turbo test:e2e", "db:generate": "pnpm --filter
@clinic-saas/db db:generate", "db:migrate": "pnpm --filter
@clinic-saas/db db:migrate", "db:studio": "pnpm --filter @clinic-saas/db
db:studio" }, "devDependencies": { "turbo": "^2.5.0", "typescript":
"^6.0.3" } }.

3.1.3 Run pnpm install. Verify pnpm-lock.yaml is created and the
workspace is recognized: pnpm list -r --depth -1 must list every
workspace package (initially none, but no errors).

3.2 — Initialize Turborepo

3.2.1 Create turbo.json: { "$schema": "https://turbo.build/schema.json",
"globalDependencies": [".env", "tsconfig.json"], "tasks": { "build": {
"dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**",
"dist/**"] }, "dev": { "cache": false, "persistent": true }, "lint": {},
"typecheck": { "dependsOn": ["^build"] }, "test": { "dependsOn":
["^build"] }, "test:e2e": { "dependsOn": ["^build"] } } }.

3.2.2 Create the directory structure: mkdir -p apps/web apps/api
apps/worker apps/patient-portal packages/db packages/auth packages/ui
packages/i18n packages/contracts packages/tsconfig
packages/eslint-config.

3.3 — Create the Shared tsconfig Package

3.3.1 In packages/tsconfig/, create package.json: { "name":
"@clinic-saas/tsconfig", "version": "0.0.0", "private": true, "files":
["*.json"] }.

3.3.2 Create base.json with strict TS settings: { "compilerOptions": {
"target": "ES2023", "module": "ESNext", "moduleResolution": "Bundler",
"strict": true, "noUncheckedIndexedAccess": true, "noImplicitOverride":
true, "exactOptionalPropertyTypes": true, "esModuleInterop": true,
"skipLibCheck": true, "forceConsistentCasingInFileNames": true,
"resolveJsonModule": true, "isolatedModules": true,
"verbatimModuleSyntax": true } }.

3.3.3 Create nextjs.json extending base.json (adds JSX, plugins, Next.js
types) and nestjs.json extending base.json (adds decorators,
emitDecoratorMetadata).

3.4 — Create the Shared eslint-config Package

3.4.1 In packages/eslint-config/, create package.json declaring
@clinic-saas/eslint-config with peer deps on eslint@10.6.0,
typescript-eslint@8.62.1, @eslint/js.

3.4.2 Create flat-config.js exporting a function that returns a
tseslint.config(...) array: js recommended + tseslint
recommendedTypeChecked + Next.js plugin rules + NestJS plugin rules +
globals + ignores (['.next/**', 'dist/**', 'coverage/**',
'node_modules/**']).

3.4.3 Add a custom lint rule (or a comment-enforced convention) that
forbids importing another NestJS module's internal services — only
index.ts public APIs. The source blueprint's §7.4 mandates this; enforce
it with eslint-plugin-import no-internal-modules.

3.5 — Scaffold apps/web (Next.js 16 PWA)

3.5.1 From apps/web/, run: pnpm create next-app@16.2.10 . — accept
TypeScript=Yes, ESLint=Yes, Tailwind=Yes, src/=No (use root app/), App
Router=Yes, import alias=@/*.

3.5.2 Edit apps/web/package.json: set "name": "@clinic-saas/web", add
scripts ("dev": "next dev", "build": "next build", "start": "next
start", "lint": "eslint .", "typecheck": "tsc --noEmit").

3.5.3 Wire the shared eslint-config: in apps/web/eslint.config.mjs,
import { createConfig } from '@clinic-saas/eslint-config' and export
default createConfig({ next: true }).

3.5.4 Wire the shared tsconfig: in apps/web/tsconfig.json, set
"extends": "@clinic-saas/tsconfig/nextjs.json".

3.5.5 Verify: pnpm --filter @clinic-saas/web dev must start the dev
server at http://localhost:3000 and render the default Next.js welcome
page.

3.6 — Scaffold apps/api (NestJS Modular Monolith)

3.6.1 From apps/api/, run: npx @nestjs/cli@latest new .
--package-manager pnpm --skip-git --strict. Choose Fastify adapter by
installing @nestjs/platform-fastify.

3.6.2 Edit apps/api/package.json: set "name": "@clinic-saas/api", wire
scripts ("dev": "nest start --watch", "build": "nest build", "start":
"node dist/main.js", "lint": "eslint .", "typecheck": "tsc --noEmit").

3.6.3 Wire shared eslint-config and tsconfig (NestJS profile). Configure
decorator metadata in nestjs.json: "experimentalDecorators": true,
"emitDecoratorMetadata": true.

3.6.4 Verify: pnpm --filter @clinic-saas/api dev must start NestJS at
http://localhost:3001 and respond to GET / with a 200.

3.7 — Scaffold apps/worker (NestJS + BullMQ)

3.7.1 From apps/worker/, run: npx @nestjs/cli@latest new .
--package-manager pnpm --skip-git --strict. Install @nestjs/bullmq
bullmq ioredis.

3.7.2 Edit apps/worker/package.json: set "name": "@clinic-saas/worker",
wire scripts. The worker will handle SMS reminder crons, payment
reconciliation, backup verification, audit-log integrity check.

3.7.3 Verify: pnpm --filter @clinic-saas/worker dev must start the
worker process. It will idle (no queues yet) — that is correct.

3.8 — Scaffold apps/patient-portal (Stub for Phase 12+)

3.8.1 Create a minimal apps/patient-portal/package.json with name
@clinic-saas/patient-portal and a README noting 'Phase 12+ — see
blueprint §11.6'. Do not scaffold a Next.js app yet; this is a
placeholder to reserve the package name.

3.9 — Scaffold packages/db (Drizzle)

3.9.1 In packages/db/, create package.json: { "name": "@clinic-saas/db",
"version": "0.0.0", "private": true, "type": "module", "main":
"./src/index.ts", "types": "./src/index.ts", "scripts": { "db:generate":
"drizzle-kit generate", "db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio" }, "dependencies": { "drizzle-orm":
"^0.40.0", "postgres": "^3.4.0" }, "devDependencies": { "drizzle-kit":
"^0.30.0", "@clinic-saas/tsconfig": "workspace:*" } }.

3.9.2 Create packages/db/src/schema/ directory with an empty index.ts.
The schema files (clinic.ts, app_user.ts, role.ts, audit_log.ts,
patient.ts, encounter.ts, dental.ts, appointment.ts, invoice.ts, etc.)
are added in Phases 4 and 10.

3.9.3 Create packages/db/drizzle.config.ts: import { defineConfig } from
'drizzle-kit'; export default defineConfig({ schema:
'./src/schema/index.ts', out: './migrations', dialect: 'postgresql',
dbCredentials: { url: process.env.DATABASE_URL!, }, verbose: true,
strict: true });

3.10 — Scaffold the Remaining Packages (Stubs)

3.10.1 packages/auth: package.json with name @clinic-saas/auth,
dependency on better-auth. Empty src/index.ts. Implementation in Phase
5.

3.10.2 packages/ui: run pnpm dlx shadcn@latest init from packages/ui/ —
choose style new-york, base color slate, CSS variables yes. Configure
components.json to install into packages/ui/. Add Button, Input, Label,
Dialog, DropdownMenu, Sonner, Avatar, Badge, Card, Form, Table, Tabs,
Tooltip.

3.10.3 packages/i18n: package.json with name @clinic-saas/i18n,
dependency on next-intl. Empty src/index.ts and messages/{ar-DZ,fr-DZ}/
common.json. Implementation in Phase 6.

3.10.4 packages/contracts: package.json with name
@clinic-saas/contracts, dependencies on @trpc/server zod. Empty
src/index.ts. Will hold tRPC routers + Zod schemas + MSW mocks as a
single source of truth.

3.11 — Verify the Workspace Builds

3.11.1 From the repo root: pnpm install (resolves all workspace deps).

3.11.2 Run pnpm typecheck — every package must pass with zero errors.
Fix any type errors before proceeding.

3.11.3 Run pnpm lint — every package must pass. Fix any lint errors.

3.11.4 Run pnpm build — apps/web must produce .next/, apps/api must
produce dist/. The other packages are libraries and produce no build
output (correct).

3.11.5 Commit: git add . && git commit -m "feat: monorepo scaffold
(Turborepo + pnpm + apps/web + apps/api + apps/worker + packages/*)".
Push to a feature branch and open a PR.

Phase 3 — Verification

On a clean clone, run pnpm install && pnpm typecheck && pnpm lint &&
pnpm build. All four must exit 0. Run pnpm --filter @clinic-saas/web dev
— http://localhost:3000 must render the Next.js welcome page. Run pnpm
--filter @clinic-saas/api dev — http://localhost:3001 must return 200.
Confirm the workspace structure matches the source blueprint §15.1.

Phase 4 — Local Database & RLS Foundation

The database is the most operationally sensitive component. A wrong RLS
policy, a missing FORCE ROW LEVEL SECURITY, or a Drizzle migration that
bypasses RLS (because it runs as table owner) can leak patient data
across clinics — a critical compliance violation under Law 18-07. This
phase sets up the local Postgres 17 in Docker, configures Drizzle with
native RLS, creates the tenant + user + audit_log schema, and writes the
CI tests that prove RLS is enforced.

4.1 — Run Local Postgres 17 in Docker

4.1.1 Create docker-compose.yml at the repo root with services: postgres
(image postgres:17-alpine, port 5432, POSTGRES_USER=app_role,
POSTGRES_PASSWORD=dev_password, POSTGRES_DB=clinic_dev, volume pgdata,
healthcheck pg_isready), redis (image redis:7-alpine, port 6379,
healthcheck redis-cli ping), orthanc (image orthancteam/orthanc:latest,
port 8042 — for Phase 10 imaging dev).

4.1.2 Start: docker compose up -d. Verify: docker compose ps must show
all three containers healthy.

4.1.3 Connect: psql
postgresql://app_role:dev_password@localhost:5432/clinic_dev -c '\q'.
The connection must succeed.

4.2 — Create the Postgres Roles (RLS Foundation)

4.2.1 Create a SQL bootstrap script packages/db/sql/001_roles.sql:
CREATE ROLE ops_superuser WITH BYPASSRLS LOGIN PASSWORD
'dev_ops_password'; CREATE ROLE app_role NOBYPASSRLS; GRANT CONNECT ON
DATABASE clinic_dev TO app_role; GRANT USAGE ON SCHEMA public TO
app_role; GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO
app_role; GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO
app_role; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT,
INSERT, UPDATE ON TABLES TO app_role; ALTER DEFAULT PRIVILEGES IN SCHEMA
public GRANT USAGE, SELECT ON SEQUENCES TO app_role.

4.2.2 Apply: psql
postgresql://app_role:dev_password@localhost:5432/clinic_dev -f
packages/db/sql/001_roles.sql — but use the ops_superuser connection to
create the roles: psql
postgresql://ops_superuser:dev_ops_password@localhost:5432/clinic_dev -f
packages/db/sql/001_roles.sql. Note: the Docker container's
POSTGRES_USER is app_role, so create ops_superuser via a different
mechanism (a Docker entrypoint script, or run psql as the postgres
superuser inside the container).

4.2.3 Critical: confirm app_role does NOT have BYPASSRLS. Run: psql ...
-c '\du app_role' — the attributes column must NOT list BYPASSRLS. This
is the single most important RLS guarantee; without it, the app role can
read every tenant's data.

4.3 — Write the Drizzle Schema for clinic, app_user, role, audit_log

4.3.1 In packages/db/src/schema/, create clinic.ts defining the tenant
table: id (uuid pk default gen_random_uuid), name, name_ar,
license_number, address, phone, email, created_at, updated_at,
deleted_at. This is the tenant entity; every other tenant-scoped table
references it.

4.3.2 Create app_user.ts: id, tenant_id (FK to clinic), email, name,
role_id (FK), password_hash, mfa_secret, is_active, last_login_at,
created_at, updated_at, deleted_at. tenant_id is nullable for
super_admin users (cross-tenant).

4.3.3 Create role.ts, privilege.ts, role_privilege.ts,
role_inheritance.ts, user_role.ts per the source blueprint §9.2 RBAC
model (NIST RBAC + OpenMRS inheritance + OpenEMR resource:action:scope
strings). Seed the role hierarchy: super_admin → clinic_admin →
physician/dentist/dental_assistant/nurse/receptionist/billing/pharmacist.

4.3.4 Create audit_log.ts per source §9.7: id (bigserial pk), timestamp,
tenant_id, actor_user_id, actor_role, action, entity_type, entity_id,
before_jsonb, after_jsonb, ip_address, user_agent, request_id, outcome,
hash_prev (bytea), hash_curr (bytea). The schema file must include RLS
directives: Drizzle's RLS API is enableRLS(table) and forceRLS(table).

4.3.5 Create a Drizzle RLS helper packages/db/src/rls.ts exporting a
function tenantPolicy(table) that returns a Drizzle RLS policy: using:
sql\`tenant_id = NULLIF(current_setting('app.current_tenant', true),
'')::uuid\`, withCheck: same. Apply this policy to every tenant-scoped
table.

4.3.6 Aggregate all schemas in packages/db/src/schema/index.ts: export *
from './clinic'; export * from './app_user'; export * from './role';
export * from './privilege'; export * from './role_privilege'; export *
from './role_inheritance'; export * from './user_role'; export * from
'./audit_log';.

4.4 — Generate and Apply the First Migration

4.4.1 Set the local DATABASE_URL in .env.local:
DATABASE_URL=postgresql://app_role:dev_password@localhost:5432/clinic_dev.
Add .env.local to .gitignore (should already be there from Phase 2).

4.4.2 Generate the migration: pnpm --filter @clinic-saas/db db:generate.
This creates packages/db/migrations/0000_initial.sql. Inspect the SQL —
it must include CREATE TABLE for clinic, app_user, role, etc., plus
ALTER TABLE ... ENABLE ROW LEVEL SECURITY and ALTER TABLE ... FORCE ROW
LEVEL SECURITY for every tenant-scoped table.

4.4.3 Apply the migration: pnpm --filter @clinic-saas/db db:migrate.
Verify: psql ... -c '\dt' lists all tables; psql ... -c '\d+ patient'
shows Row Security: 'enabled, forced' (once patient is added in Phase
10).

4.5 — Create the Audit Log Revoke and Hash-Chain Triggers

4.5.1 Create packages/db/sql/002_audit_log_immutable.sql: REVOKE UPDATE,
DELETE ON audit_log FROM app_role; CREATE TRIGGER audit_log_hash_chain
BEFORE INSERT ON audit_log FOR EACH ROW EXECUTE FUNCTION
compute_audit_hash_curr(); — where compute_audit_hash_curr() is a
PL/pgSQL function that reads the previous row's hash_curr and computes
the new row's hash_curr as SHA-256 of (prev_hash ||
canonical_json(this_row)).

4.5.2 Apply the SQL: psql ... -f
packages/db/sql/002_audit_log_immutable.sql. Verify: as app_role,
attempt UPDATE audit_log SET action='hacked' WHERE id=1 — must be denied
(permission denied). Attempt DELETE — must be denied.

4.5.3 Write a Drizzle seed script packages/db/src/seed.ts that inserts a
test clinic, a clinic_admin user, a physician user, and a receptionist
user. The seed must be idempotent (use ON CONFLICT DO NOTHING). Add a
script to packages/db/package.json: "db:seed": "tsx src/seed.ts".

4.6 — Write the CI Tests for RLS and Audit Immutability

4.6.1 Create packages/db/src/__tests__/rls.test.ts: test 1 — connect as
app_role, SET LOCAL app.current_tenant to clinic A, INSERT a patient in
clinic A, then SET LOCAL app.current_tenant to clinic B, SELECT * FROM
patient — must return zero rows. test 2 — attempt INSERT into clinic B
with tenant_id=clinic_A_id — must be denied by the WITH CHECK policy.

4.6.2 Create packages/db/src/__tests__/audit_log.test.ts: test 1 —
attempt UPDATE on audit_log as app_role — must throw permission denied.
test 2 — attempt DELETE — must throw. test 3 — INSERT a row, then INSERT
another row, verify hash_curr of row 2 equals SHA-256(hash_curr of row 1
|| canonical JSON of row 2).

4.6.3 Run the tests: pnpm --filter @clinic-saas/db test. All must pass.
If any fails, do NOT proceed — RLS or audit immutability is broken and
every subsequent phase inherits the bug.

4.7 — Set Up Neon Free for Staging

4.7.1 Sign up at neon.tech (free). Create a project clinic-saas-staging
in region AWS eu-central-1 (Frankfurt — closest to Algeria with
reasonable latency; AWS Paris eu-west-3 is also acceptable for staging,
but NOT for production — production MUST be Algerian).

4.7.2 From the Neon dashboard, copy the pooled connection string (host
contains -pooler.) and the direct connection string. Store both in
Doppler: doppler secrets set DATABASE_URL_STAGING DIRECT_URL_STAGING.
The pooled URL is for the app at runtime; the direct URL is for Drizzle
migrations.

4.7.3 Apply migrations to staging: DATABASE_URL=<staging direct url>
pnpm --filter @clinic-saas/db db:migrate. Verify with Drizzle Studio:
pnpm --filter @clinic-saas/db db:studio --url <staging pooled url> — the
tables must be visible.

Phase 4 — Verification

On a clean clone: docker compose up -d && pnpm install && pnpm --filter
@clinic-saas/db db:migrate && pnpm --filter @clinic-saas/db db:seed &&
pnpm --filter @clinic-saas/db test. The RLS tests must prove
cross-tenant queries return zero rows. The audit_log tests must prove
UPDATE and DELETE are denied to app_role. The hash-chain test must
verify integrity. The Neon staging DB must have the same schema applied.

+-----------------------------------------------------------------------+
| Critical — FORCE ROW LEVEL SECURITY is mandatory                      |
|                                                                       |
| Without FORCE, the table owner (the role that ran the migration)      |
| bypasses RLS policies. Drizzle migrations run as ops_superuser        |
| (BYPASSRLS) or as the table owner; if FORCE is missing, an attacker   |
| who gains the migration role's credentials can read every tenant's    |
| data. FORCE RLS on every tenant-scoped table is non-negotiable. The   |
| CI test in 4.6 catches any table missing it.                          |
+=======================================================================+
+-----------------------------------------------------------------------+

Phase 5 — Authentication & Tenant Interceptor

Authentication is the perimeter of the system. A mistake here exposes
every patient's data. This phase implements Better Auth with the
Organization plugin (multi-tenant SaaS native), the TenantInterceptor
that issues SET LOCAL app.current_tenant per request, the
PermissionsGuard that walks the role inheritance graph, the
AuditInterceptor that captures before/after state for all mutations, and
the EgressGuard that blocks personal-data fields from leaving for AWS
Paris. By the end of this phase, login, tenant switch, RBAC, audit
capture, and RLS are all wired and tested.

5.1 — Configure Better Auth

5.1.1 In packages/auth/src/, create auth.ts: import { betterAuth } from
'better-auth'; import { organization } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle'; import *
as schema from '@clinic-saas/db/schema'; export const auth =
betterAuth({ database: drizzleAdapter(db, { provider: 'pg', schema }),
emailAndPassword: { enabled: true }, plugins: [organization({
allowUserToCreateOrganization: false })], session: { expiresIn:
60*60*24*7, updateAge: 60*60*24 } });.

5.1.2 Generate the Better Auth schema: pnpm --filter @clinic-saas/auth
exec @better-auth/cli@latest generate. This produces the user, session,
account, verification, organization, organization_member tables. Add
these to packages/db/src/schema/auth.ts and regenerate the Drizzle
migration: pnpm --filter @clinic-saas/db db:generate → produces
0001_auth_tables.sql.

5.1.3 Apply the migration locally and to staging. Verify the auth tables
exist with Drizzle Studio.

5.2 — Expose the Auth Endpoints in apps/api

5.2.1 In apps/api/src/modules/auth/, create auth.controller.ts that
mounts Better Auth's handler at /api/auth/*. Better Auth exposes
/api/auth/sign-in, /sign-up, /sign-out, /session, /organization/*, etc.

5.2.2 Configure the NestJS global prefix so auth routes are /api/auth/*
and the API routes are /api/<module>/*. Set in main.ts:
app.setGlobalPrefix('api', { exclude: ['auth'] }) — but Better Auth
wants /api/auth/*, so set the prefix to 'api' and let auth.controller
mount at 'auth/*'.

5.2.3 Verify: pnpm --filter @clinic-saas/api dev, then curl -X POST
http://localhost:3001/api/auth/sign-up/email -H 'Content-Type:
application/json' -d
'{"email":"test@example.com","password":"...","name":"Test"}' must
create a user and return a session cookie.

5.3 — Implement the TenantInterceptor

5.3.1 In apps/api/src/infrastructure/rls/tenant.interceptor.ts, create a
NestJS interceptor that reads the tenant_id from the authenticated
session (or the X-Tenant-Id header for super_admin), opens a Drizzle
transaction, and issues SET LOCAL app.current_tenant = $1 with the
tenant_id. Store the transaction on the request object so downstream
services use it.

5.3.2 Register the TenantInterceptor globally in app.module.ts as an
APP_INTERCEPTOR. After the request completes, COMMIT or ROLLBACK the
transaction (the SET LOCAL scope ends with the transaction).

5.3.3 Critical: NEVER run a query on a tenant-scoped table outside the
TenantInterceptor's transaction. Add a lint rule or a runtime assertion
that throws if a tenant-scoped query runs without app.current_tenant
set. This catches missing-interceptor bugs.

5.4 — Implement the PermissionsGuard

5.4.1 In apps/api/src/modules/auth/permissions.guard.ts, create a NestJS
guard that reads the @RequirePermissions('encounter:write') decorator
from the handler, walks the user's role inheritance graph
(role_inheritance table) to compute the effective privilege set, and
caches it per request.

5.4.2 Use the resource:action:scope format from the source blueprint
§9.2 (e.g., patient:read:any, patient:read:my, encounter:write,
prescription:write, billing:discount). Seed the privilege table with the
source blueprint's §9.2 RBAC privilege strings.

5.4.3 Verify: create a test endpoint with
@RequirePermissions('clinic:manage_users'), call it as a receptionist
user — must return 403. Call it as a clinic_admin — must return 200.

5.5 — Implement the AuditInterceptor

5.5.1 In apps/api/src/modules/audit/audit.interceptor.ts, create a
NestJS interceptor that runs on every mutating request
(POST/PUT/PATCH/DELETE). Before the handler runs, capture the current
state of affected entities (for UPDATE/DELETE) via a SELECT. After the
handler, capture the new state. Write a row to audit_log with
before_jsonb, after_jsonb, action, entity_type, entity_id,
actor_user_id, ip_address, user_agent, request_id.

5.5.2 The audit_log write must occur in the same transaction as the
mutation, so a mutation failure rolls back the audit row. Use the
transaction stored on the request by the TenantInterceptor.

5.5.3 Verify: make a mutation, then SELECT * FROM audit_log ORDER BY id
DESC LIMIT 1 — the row must contain correct before_jsonb, after_jsonb,
actor_user_id, and a non-null hash_curr that chains correctly to the
previous row.

5.6 — Implement the EgressGuard

5.6.1 In apps/api/src/infrastructure/egress/egress.guard.ts, create a
NestJS interceptor that inspects outbound HTTP calls (use a global fetch
wrapper or an axios interceptor). For any call to a non-Algerian host
(anything not in the allowlist: CERIST, Djezzy, Algérie Télécom, and the
local dev hosts), assert that the payload contains no personal-data
fields (name, phone, NIN, address, email, DOB). If a personal-data field
is present, block the call and log to audit_log with
action='egress.blocked'.

5.6.2 In development and staging, the EgressGuard is in 'log' mode
(warns but does not block). In production, it is in 'block' mode.
Configure via the EGRESS_GUARD_MODE env var.

5.6.3 Add Sentry PII scrubbing rules: configure Sentry's beforeSend to
redact patient names, NINs, phone numbers, and addresses from error
context. The EgressGuard and Sentry scrubbing are defense-in-depth —
both must be in place before production.

5.7 — Write the Login and Tenant-Switch Endpoints

5.7.1 Better Auth provides /api/auth/sign-in/email and
/api/auth/sign-out. Add a custom /api/auth/switch-tenant endpoint that
takes a tenant_id, verifies the user is a member of that tenant (via
organization_member), and returns a new session with the new tenant_id
claim.

5.7.2 Add an /api/auth/me endpoint that returns the current user, their
active tenant, and their effective permissions. The frontend uses this
to render role-appropriate UI.

5.7.3 Write E2E tests (Playwright) for: sign-up, sign-in, tenant switch,
sign-out, and the 403 path (receptionist hitting an admin endpoint).

Phase 5 — Verification

Sign up a clinic_admin user, sign in, switch tenant, hit a protected
endpoint as the wrong role (must 403), make a mutation (must produce an
audit_log row with a valid hash_curr), attempt to UPDATE audit_log (must
be denied), and verify EgressGuard logs an attempt to send a
personal-data field to a non-Algerian host. All tests must pass before
Phase 6.

Phase 6 — RTL/i18n Scaffold (ar-DZ + fr-DZ)

Bilingual RTL support is a Phase 0 concern per the source blueprint —
not a Phase 6 polish. The reason: retrofitting RTL onto a UI built with
physical-left/right CSS is a multi-week audit of every component;
building with Tailwind v4 logical properties from day one is free. This
phase wires next-intl with ar-DZ (RTL) and fr-DZ (LTR), forces Western
numerals (the Maghreb convention — never Eastern Arabic-Indic ٠١٢٣), and
audits the login page in both directions with axe-core.

6.1 — Configure next-intl in apps/web

6.1.1 Install: pnpm --filter @clinic-saas/web add next-intl@3.27.0.

6.1.2 Create apps/web/src/i18n/routing.ts: import { defineRouting } from
'next-intl/routing'; export const routing = defineRouting({ locales:
['ar-DZ', 'fr-DZ'], defaultLocale: 'fr-DZ', localePrefix: 'always' });.

6.1.3 Create apps/web/src/i18n/request.ts: import { getRequestConfig }
from 'next-intl/server'; import { routing } from './routing'; export
default getRequestConfig(async ({ requestLocale }) => { const requested
= await requestLocale; const locale = requested &&
routing.locales.includes(requested as any) ? requested :
routing.defaultLocale; return { locale, messages: (await
import(`../../packages/i18n/messages/${locale}/common.json`)).default };
});

6.1.4 Create apps/web/src/middleware.ts: import createMiddleware from
'next-intl/middleware'; import { routing } from './i18n/routing'; export
default createMiddleware(routing); export const config = { matcher:
['/((?!api|_next|_vercel|.*\..*).*)'] };

6.1.5 Wrap the root layout with NextIntlClientProvider in
apps/web/src/app/[locale]/layout.tsx. Set <html lang={locale}
dir={locale === 'ar-DZ' ? 'rtl' : 'ltr'}>.

6.2 — Configure Tailwind v4 Logical Properties

6.2.1 Confirm apps/web/src/app/globals.css begins with @import
"tailwindcss"; (Tailwind v4 CSS-first config).

6.2.2 Add a dark-mode variant and the design tokens: @custom-variant
dark (&:where(.dark, .dark *)); @theme { --color-brand-500: oklch(0.65
0.2 250); --font-sans: "Inter", "Noto Sans Arabic", sans-serif; }. The
Noto Sans Arabic fallback ensures Arabic glyphs render correctly.

6.2.3 Add a lint rule (eslint-plugin-tailwindcss with the
no-physical-properties rule, or a custom rule) that forbids ml-*, mr-*,
pl-*, pr-*, left-*, right-* in source. Allow left-/right- only in CSS
for non-layout purposes (e.g., absolute positioning that should not
flip). Document the convention in docs/conventions/rtl.md.

6.3 — Set the Numbering System to latn (Western Numerals)

6.3.1 In apps/web/src/i18n/request.ts and in
packages/i18n/messages/{ar-DZ,fr-DZ}/common.json, ensure the
Intl.NumberFormat and Intl.DateTimeFormat calls use numberingSystem:
'latn'. The Maghreb convention is Western numerals 0-9; Eastern
Arabic-Indic ٠١٢٣ are NOT used in Algerian clinics.

6.3.2 Add a unit test that formats the number 1234.56 in ar-DZ and
asserts the output contains '1,234.56' (Western numerals with comma
thousands separator) — NOT '١٬٢٣٤٫٥٦'.

6.4 — Create the Locale Switcher

6.4.1 Create apps/web/src/components/locale-switcher.tsx using the
shadcn DropdownMenu. The switcher calls useLocale() and usePathname()
and router.replace(pathname, { locale: newLocale }) to switch. Persist
the choice in a cookie (next-intl handles this via the
COOKIE_LOCALE_NAME config).

6.4.2 Place the locale switcher in the top navigation. Verify: switch
from fr-DZ to ar-DZ — the entire layout must flip to RTL, the language
must change, and the numerals must remain Western.

6.5 — Translate the Login Page

6.5.1 Create packages/i18n/messages/fr-DZ/common.json with keys for the
login page: "login.title": "Connexion", "login.email": "Adresse e-mail",
"login.password": "Mot de passe", "login.submit": "Se connecter",
"login.error.invalid": "E-mail ou mot de passe invalide".

6.5.2 Create packages/i18n/messages/ar-DZ/common.json with the same
keys: "login.title": "تسجيل الدخول", "login.email": "البريد الإلكتروني",
"login.password": "كلمة المرور", "login.submit": "دخول",
"login.error.invalid": "البريد الإلكتروني أو كلمة المرور غير صالحة".

6.5.3 Build the login page in apps/web/src/app/[locale]/login/page.tsx
using useTranslations('common') and the shadcn Form + Input + Button.
Verify in both locales.

6.6 — Add the axe-core Accessibility Gate

6.6.1 Install: pnpm --filter @clinic-saas/web add -D
@axe-core/playwright@4.10.0.

6.6.2 Create apps/web/tests/e2e/accessibility.spec.ts that visits
/ar-DZ/login and /fr-DZ/login and runs AxeBuilder({ withTags: ['wcag2a',
'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }).getResults() — assert
no serious or critical violations.

6.6.3 Add this test to the CI gate (configured in Phase 7). It must pass
on every PR.

6.7 — Write the Trilingual Glossary Stub

6.7.1 Complete docs/domain/glossary.md with the source blueprint's terms
in EN, FR, and AR: patient, appointment, encounter, prescription,
odontogram, invoice, operatory, practitioner, vitals, allergy,
medication, immunization, SOAP note, etc. This is the source of truth
for AI agents; reference it from AGENTS.md.

Phase 6 — Verification

Load /fr-DZ/login — must render LTR with French text. Switch to
/ar-DZ/login — must render RTL with Arabic text, Western numerals,
mirrored icons. Run the axe-core test — must report zero serious or
critical violations in both locales. Confirm the locale switcher
persists the choice across reloads.

Phase 7 — CI/CD Pipeline on GitHub Actions (Free Tier)

The CI/CD pipeline is the assembly line. Every PR runs lint, typecheck,
unit tests, build, E2E tests, Lighthouse, and accessibility scans; every
merge to main deploys to staging; every tag deploys to production
(production deploys are wired in Phase 15–16, not here). The $0 path
uses GitHub Free with a public repo for unlimited Actions minutes; if
the repo is private, the 2000-minutes/month limit is sufficient for a
solo operator but must be monitored.

7.1 — Create the CI Workflow

7.1.1 Create .github/workflows/ci.yml named ci that triggers on push
(branches: [main]) and pull_request. The workflow runs on ubuntu-latest
(= ubuntu-24.04).

7.1.2 Configure Node and pnpm via Corepack: use actions/checkout@v7,
then actions/setup-node@v6 with node-version: '24.18.0' and cache:
'pnpm'. Add pnpm install --frozen-lockfile.

7.1.3 Run four jobs in parallel: lint (pnpm lint), typecheck (pnpm
typecheck), test (pnpm test --coverage), build (pnpm build). Upload the
coverage report via actions/upload-artifact@v7. Each job must be
independent so failures point to a specific stage.

7.2 — Add the RLS and Audit-Log CI Jobs

7.2.1 Add a job db-integrity that spins up a Postgres 17 service
container (services: postgres:17-alpine with env POSTGRES_USER=app_role,
POSTGRES_PASSWORD=dev_password, POSTGRES_DB=clinic_test, ports
5432:5432).

7.2.2 The job runs: pnpm --filter @clinic-saas/db db:migrate (against
the service container), then pnpm --filter @clinic-saas/db test — which
runs the RLS and audit_log tests from Phase 4.6. A failure blocks the
PR.

7.3 — Add the E2E Job

7.3.1 Add a job e2e that runs on ubuntu-latest after db-integrity
succeeds. Install Playwright browsers: pnpm exec playwright install
--with-deps. Start the API and web in the background: pnpm --filter
@clinic-saas/api start & and pnpm --filter @clinic-saas/web start & —
wait with npx wait-on http://localhost:3001 and http://localhost:3000.

7.3.2 Run pnpm test:e2e. Upload the Playwright HTML report and trace
artifacts on failure via actions/upload-artifact@v7.

7.4 — Add the Lighthouse CI Job

7.4.1 Create .github/workflows/lighthouse.yml (separate workflow to keep
the main CI fast) that triggers on push to main and on pull_request. Use
the same checkout/setup-node/install steps.

7.4.2 Build and start: pnpm --filter @clinic-saas/web build && pnpm
--filter @clinic-saas/web start --port 3000 &. Wait with npx wait-on
http://localhost:3000. Run npx @lhci/cli@0.15.1 autorun
--collect.url=http://localhost:3000/fr-DZ/login
--collect.url=http://localhost:3000/ar-DZ/login --collect.numberOfRuns=3
--upload.target=temporary-public-storage.

7.4.3 Create lighthouserc.json at the repo root: { "ci": { "collect": {
"numberOfRuns": 3, "settings": { "preset": "desktop" } }, "assert": {
"preset": "lighthouse:recommended", "assertions": {
"categories:performance": ["warn", { "minScore": 0.9 }],
"categories:accessibility": ["error", { "minScore": 0.95 }] } },
"upload": { "target": "temporary-public-storage" } } }. Accessibility
below 0.95 fails the workflow; performance below 0.9 warns.

7.5 — Add the Accessibility CI Job (axe-core)

7.5.1 The Playwright accessibility.spec.ts from Phase 6.6 runs as part
of the e2e job. Ensure it is included in the e2e job's playwright run by
setting testDir appropriately in apps/web/playwright.config.ts.

7.6 — Add the Dependency Review Job

7.6.1 Add a job dependency-review to ci.yml that uses
actions/dependency-review-action@v5.0.0 on pull_request only. This fails
the PR if a newly added dependency has a known vulnerability or an
incompatible license.

7.7 — Add the CodeQL Job

7.7.1 Create .github/workflows/codeql.yml that runs
github/codeql-action@v3 on push to main and on a weekly schedule.
Configure the analysis to use the javascript-typescript language pack.
CodeQL catches SQL injection, XSS, and prototype pollution statically.

7.8 — Add the Staging Deploy Workflow (Vercel Hobby)

7.8.1 Create .github/workflows/deploy-staging.yml that triggers on push
to main (after ci passes via workflow_run trigger). The job runs on
ubuntu-latest.

7.8.2 Install Vercel CLI: npm install -g vercel@54.20.1. Set
VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID as repository secrets
(from Vercel project settings). Pull env: vercel env pull
--environment=preview --yes.

7.8.3 Deploy to Vercel preview: vercel --yes --token=$VERCEL_TOKEN.
Vercel auto-deploys preview URLs on every PR push anyway, but this
workflow ensures the main-branch deploy is tracked. The production
deploy is wired in Phase 16 to the Algerian sovereign infrastructure,
NOT to Vercel.

7.9 — Optimize CI Caching

7.9.1 Cache the pnpm store via actions/setup-node's cache: 'pnpm'
(already added in 7.1.2).

7.9.2 Cache the Next.js build via actions/cache@v6 with path:
apps/web/.next/cache and key: nextjs-${{ runner.os }}-${{
hashFiles('pnpm-lock.yaml') }}-${{ hashFiles('apps/web/**.{ts,tsx}',
'packages/**.{ts,tsx}') }}.

7.9.3 Cache Playwright browsers via actions/cache@v6 with path:
~/.cache/ms-playwright and key: playwright-${{ runner.os }}-${{
hashFiles('pnpm-lock.yaml') }}.

7.9.4 Set timeout-minutes: 15 on every job so a hung job fails loudly
rather than consuming runner minutes.

Phase 7 — Verification

Open a PR. Within 10 minutes, all CI jobs (lint, typecheck, test, build,
db-integrity, e2e, lighthouse, dependency-review) must be green. The PR
must show a Vercel preview URL comment. Merge the PR — the
deploy-staging workflow must run and produce a new preview deployment.
Confirm CodeQL analysis appears in the Security tab. Confirm the
Renovate dashboard and the AI PR review bot's reviews are active on
every PR.

Phase 8 — Testing Foundations (Vitest + Playwright + MSW + axe-core)

Tests are the executable specification. Without them, every AI-agent PR
is a gamble. This phase builds the full pyramid: Vitest for unit and
integration, Playwright for E2E, MSW for API mocking, and axe-core for
accessibility. By the end of this phase, the test suite runs in under
five minutes and gates every PR.

8.1 — Configure Vitest 4

8.1.1 Install: pnpm add -Dw vitest@4.1.10 @vitest/coverage-v8@4.1.10
@vitejs/plugin-react@4.6.0 happy-dom@20.10.6
@testing-library/react@16.3.0 @testing-library/jest-dom@6.6.3
@testing-library/user-event@14.5.2 msw@2.10.0.

8.1.2 Create vitest.config.ts at the repo root: import { defineConfig }
from 'vitest/config'; import react from '@vitejs/plugin-react'; import {
resolve } from 'node:path'; export default defineConfig({ plugins:
[react()], test: { environment: 'happy-dom', globals: true, setupFiles:
['./vitest.setup.ts'], coverage: { provider: 'v8', reporter: ['text',
'lcov'], include: ['apps/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
exclude: ['**/*.e2e.ts', '**/node_modules/**'] } }, resolve: { alias: {
'@': resolve(__dirname, './apps/web/src'), '@clinic-saas':
resolve(__dirname, './packages') } } });

8.1.3 Create vitest.setup.ts: import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest'; import { server
} from './packages/contracts/mocks/server'; beforeAll(() =>
server.listen()); afterEach(() => server.resetHandlers()); afterAll(()
=> server.close());

8.1.4 Set coverage thresholds: coverage: { ..., thresholds: { lines: 80,
functions: 80, branches: 75, statements: 80 } }.

8.2 — Write Unit Tests for Pure Logic

8.2.1 Place unit tests next to the source:
packages/db/src/utils/canonical-json.test.ts for
packages/db/src/utils/canonical-json.ts. Vitest auto-discovers *.test.ts
files.

8.2.2 Test pure functions (canonical JSON for audit hash chain, FDI
tooth validation, TVA rate lookup, currency formatting) with
input/output tables. Aim for 100% coverage on pure logic.

8.3 — Set Up MSW for API Mocking

8.3.1 In packages/contracts/mocks/, create server.ts: import {
setupServer } from 'msw/node'; import { handlers } from './handlers';
export const server = setupServer(...handlers);.

8.3.2 Create handlers.ts with default handlers for every API endpoint:
GET /api/auth/me, POST /api/auth/sign-in, GET /api/patients, POST
/api/patients, etc. Use realistic fixture data from
packages/contracts/mocks/fixtures/.

8.3.3 Component tests use MSW automatically (configured in
vitest.setup.ts). Tests override handlers with server.use(...) for
specific scenarios (error responses, empty lists, etc.).

8.4 — Configure Playwright

8.4.1 Install: pnpm --filter @clinic-saas/web add -D
@playwright/test@1.61.1. Run pnpm exec playwright install --with-deps.

8.4.2 Create apps/web/playwright.config.ts: import { defineConfig,
devices } from '@playwright/test'; export default defineConfig({
testDir: './tests/e2e', fullyParallel: true, forbidOnly:
!!process.env.CI, retries: process.env.CI ? 2 : 0, reporter:
process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
projects: [ { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
{ name: 'webkit', use: { ...devices['Desktop Safari'] } }, { name:
'mobile', use: { ...devices['iPhone 15'] } } ], webServer: { command:
'pnpm dev', url: 'http://localhost:3000', reuseExistingServer:
!process.env.CI, timeoutMs: 120_000 } });

8.4.3 Add scripts to apps/web/package.json: "test:e2e": "playwright
test", "test:e2e:ui": "playwright test --ui".

8.5 — Write E2E Tests for Critical Journeys

8.5.1 Identify the critical journeys: sign-in, tenant switch, create
patient, book appointment, start encounter, generate invoice, sign-out.
Write one Playwright spec per journey in
apps/web/tests/e2e/<journey>.spec.ts.

8.5.2 Use Playwright's auth fixtures: sign in once via the test API (or
the Better Auth sign-in endpoint), save storageState to
tests/e2e/.auth/user.json, and reuse across tests with test.use({
storageState: 'tests/e2e/.auth/user.json' }). Add tests/e2e/.auth/ to
.gitignore.

8.5.3 Add the accessibility spec (Phase 6.6) that visits every public
page in both locales and asserts zero serious or critical axe
violations.

8.6 — Run the Full Suite Locally

8.6.1 Run pnpm test && pnpm test:e2e. The unit suite must finish in
under 60 seconds; the E2E suite must finish in under 4 minutes. If
either is slower, parallelize before adding more tests.

8.6.2 Generate the coverage report: pnpm test --coverage. Confirm the
thresholds pass.

Phase 8 — Verification

On a clean clone: pnpm install && pnpm test && pnpm test:e2e — the full
suite must pass. Coverage must meet the 80/80/75/80 thresholds. The E2E
suite must cover sign-in, tenant switch, create patient, book
appointment, sign-out. The accessibility spec must pass on every public
page in both locales. Total wall-clock under 5 minutes.

Phase 9 — PWA & Offline-First (Serwist + Dexie + Sync Outbox)

Algerian clinic internet is reliable in major cities but degrades in
rural areas; the operator's clinic may lose connectivity for hours
during a power cut. The offline-first PWA is therefore not a polish — it
is a clinical safety feature. This phase implements the installable PWA
with Serwist, the Dexie (IndexedDB) local database, the sync outbox that
drains on reconnect, and the service-worker update flow that never
auto-skipWaiting (a mid-consultation SW update can corrupt clinical
data).

9.1 — Configure Serwist for the PWA

9.1.1 Install: pnpm --filter @clinic-saas/web add @serwist/next@latest
serwist.

9.1.2 In apps/web/next.config.ts, wrap the config with withSerwist:
import withSerwistInit from '@serwist/next'; const withSerwist =
withSerwistInit({ swSrc: 'src/app/sw.ts', swDest: 'public/sw.js',
disable: process.env.NODE_ENV === 'development' }); export default
withSerwist({ /* existing config */ }).

9.1.3 Create apps/web/src/app/sw.ts: import { defaultCache } from
'@serwist/next/worker'; import type { PrecacheEntry } from 'serwist';
import { Serwist } from 'serwist'; declare let self:
ServiceWorkerGlobalScope; const serwist = new Serwist({ precacheEntries:
self.__SW_MANIFEST as PrecacheEntry[], skipWaiting: false, clientsClaim:
true, navigationPreload: true, runtimeCaching: defaultCache });
serwist.addEventListeners();

9.1.4 Critical: skipWaiting is false. Show an 'Update available' toast
via the Serwist update event and let the user reload explicitly.
Auto-updating a service worker mid-consultation can break in-flight data
flows.

9.1.5 Create apps/web/public/manifest.webmanifest (or use Next.js's
app/manifest.ts convention) with name, short_name, icons (192px and
512px PNG), theme_color, background_color, display: 'standalone',
start_url, lang. Verify the app is installable in Chrome (the install
icon appears in the address bar).

9.2 — Install and Configure Dexie

9.2.1 Install: pnpm --filter @clinic-saas/web add dexie
dexie-react-hooks.

9.2.2 Create apps/web/src/lib/db/dexie.ts: import Dexie, { Table } from
'dexie'; interface Patient { id: string; tenant_id: string; family_name:
string; given_name: string; ... } interface OutboxEntry { id: string;
entity_type: string; entity_id: string; operation: 'create' | 'update' |
'delete'; payload: any; client_id: string; created_at: number; attempts:
number; last_error: string | null; status: 'pending' | 'syncing' |
'conflict' | 'failed'; } class ClinicDB extends Dexie { patients!:
Table<Patient, string>; outbox!: Table<OutboxEntry, string>;
constructor() { super('clinic-saas'); this.version(1).stores({ patients:
'id, tenant_id, family_name, given_name', outbox: 'id, status,
entity_type, entity_id' }); } } export const db = new ClinicDB();

9.3 — Implement the Sync Outbox

9.3.1 Create apps/web/src/lib/sync/outbox.ts with drainOutbox() that
reads pending entries, attempts the API call for each, deletes on
success, marks 'conflict' on a 409 (and re-pulls the server version), or
marks 'failed' after 5 attempts. Use exponential backoff.

9.3.2 Register drainOutbox on the 'online' window event:
window.addEventListener('online', drainOutbox). Also register a
Background Sync callback (progressive enhancement — Chromium only;
Safari and Firefox use the foreground drain).

9.3.3 Add a sync-status indicator in the app shell: a green dot when the
outbox is empty, a yellow dot when pending entries exist, a red dot when
any entry is 'failed'. The dentist can see at a glance whether their
data has synced.

9.4 — Implement Conflict Resolution (LWW)

9.4.1 Use Last-Write-Wins (LWW) with server-authoritative updated_at:
when the server receives a mutation, it compares the client's updated_at
with the server's current updated_at; if the client is older, return 409
Conflict with the server's current version. The client reconciles by
overwriting its local copy with the server's version.

9.4.2 For the handful of multi-author records (SOAP notes, shared
treatment plans), wrap the text field in a Yjs document for
collaborative editing. This is a Phase 10 concern; the schema
accommodates it from day 1.

9.5 — Test Offline Behavior

9.5.1 Write a Playwright test that: signs in, creates a patient while
online, goes offline (test.use({ offline: true }) or
context.setOffline(true)), creates another patient, goes online, and
asserts the second patient appears in the server within 5 seconds
(outbox drained).

9.5.2 Write a test that simulates a service-worker update mid-session:
install the old SW, navigate to a page, push an update, verify the
'Update available' toast appears, verify NO auto-reload happens until
the user clicks 'Reload'.

Phase 9 — Verification

Install the PWA on Chrome desktop and on an Android device. Verify: the
app loads offline (after first visit), a patient created offline is
queued in the outbox, reconnecting drains the outbox within 5 seconds,
the sync-status indicator reflects the outbox state. Verify the SW
update toast appears on a new deploy and that NO auto-reload occurs.

Phase 10 — Core Domain Modules (Patient, Encounter, Dental, Appointment, Billing)

This phase implements the five core domain modules that constitute the
MVP: Patient, Encounter (medical), Dental (odontogram + FDI + CDT),
Appointment (scheduling), and Billing (Algerian TVA-compliant
invoicing). Each module is a NestJS module with its Drizzle schema, a
tRPC router (exposed via trpc-openapi for the frontend), a set of
Playwright E2E tests, and audit-log coverage. The source blueprint's §9
defines the data model; this phase implements it.

10.1 — Patient Module

10.1.1 Create packages/db/src/schema/patient.ts per source §9.3: id,
tenant_id, family_name, given_name, dob, sex, address, phone, nin
(National Identification Number), insurance, emergency_contact,
language_pref (ar-DZ|fr-DZ), created_at, updated_at, deleted_at,
created_by. RLS-enabled and forced.

10.1.2 Create apps/api/src/modules/patient/ with patient.module.ts,
patient.controller.ts (or patient.trpc-router.ts), patient.service.ts.
The service exposes: create, update, softDelete, search (FTS), getById,
list (paginated). All mutations go through the AuditInterceptor.

10.1.3 Add the tRPC router to packages/contracts/src/patient.ts with Zod
input schemas. The frontend imports the router type for end-to-end type
inference.

10.1.4 Build the patient list page
(apps/web/src/app/[locale]/(app)/patients/page.tsx) with search,
pagination, and a create-patient dialog. Verify in both locales.

10.2 — Encounter Module (Medical)

10.2.1 Create packages/db/src/schema/encounter.ts per source §9.3: id,
tenant_id, patient_id, type (medical|dental|telemed), status, start_ts,
end_ts, provider_id, operatory_id, chief_complaint, created_at,
updated_at, deleted_at.

10.2.2 Create packages/db/src/schema/observation.ts, problem_list.ts,
allergy.ts, medication.ts, immunization.ts, lab_result.ts,
vital_signs.ts, soap_note.ts per source §9.3. Each is tenant-scoped with
RLS.

10.2.3 Build the encounter UI: a SOAP note editor (Subjective,
Objective, Assessment, Plan as four text areas or a structured form), a
vitals entry form, an allergies/medications/problems list. Use the
shadcn Form + Input + Textarea components.

10.3 — Dental Module (Odontogram, FDI, CDT)

10.3.1 Create packages/db/src/schema/dental.ts with tooth_finding (id,
tenant_id, patient_id, encounter_id, tooth_fdi INT CHECK (tooth_fdi IN
(11..18, 21..28, 31..38, 41..48, 51..55, 61..65, 71..75, 81..85)),
surfaces BIT INT, finding, code, code_system), treatment_plan,
perio_exam (with JSONB for the 6×32 measurement matrix per source
§9.4.4).

10.3.2 Build the odontogram UI: a visual SVG of 32 adult teeth (and 20
primary) where the dentist clicks a tooth to add a finding. Use the FDI
Two-Digit Notation (ISO 3950:2016) for storage; display-only conversion
to Universal (US) is optional.

10.3.3 Seed the CDT code catalog (D0120 periodic oral evaluation, D1110
adult prophylaxis, D2150 amalgam 2 surfaces, etc.) into a procedure_code
table with code_system='cdt'. Add a code_system='local' escape hatch for
procedures that don't map to CDT.

10.3.4 Build the periodontal charting UI: a 6-sites-per-tooth grid
(mesiobuccal, buccal, distobuccal, mesiolingual, lingual, distolingual)
with PD, BOP, recession, CAL, furcation, mobility fields. Store as JSONB
on perio_exam.

10.4 — Appointment Module

10.4.1 Create packages/db/src/schema/appointment.ts per source §9.5: id,
tenant_id, patient_id, practitioner_id, operatory_id,
appointment_type_id, start_ts, end_ts, status
(proposed|pending|booked|arrived|in-progress|fulfilled|cancelled|no-show),
cancellation_reason, recurrence_rule (iCal RRULE), recurrence_parent_id,
notes.

10.4.2 Create operatory.ts (chair/room), practitioner_schedule.ts
(provider working hours template), appointment_type.ts (Cleaning,
Filling, Consultation with default durations and colors).

10.4.3 Build the calendar UI: a day/week view with operatory columns and
provider rows. Use an existing calendar library (react-big-calendar or
@fullcalendar/react) or build custom. Double-booking prevention: the
booking endpoint checks for overlapping appointments in the same
operatory with the same provider.

10.4.4 Implement the appointment status state machine per source §9.5:
proposed → pending → booked → arrived → in-progress → fulfilled, with
cancelled and no-show as terminal states. The receptionist dashboard
shows 'arrived' patients in a waiting-room queue.

10.5 — Billing Module (Algerian TVA Compliance)

10.5.1 Create packages/db/src/schema/invoice.ts, invoice_line.ts,
payment.ts, refund.ts, cash_drawer_session.ts per source §9.6. The
invoice table stores DGI mandatory mentions (supplier_nif, supplier_nis,
supplier_rc, patient_nif) denormalized at issue time.

10.5.2 Implement the TVA logic: medical acts are TVA-exempt (rate=0,
medical_exempt class); non-medical items (cosmetic, retail) at 9% or
19%. Add a tva_class enum on procedure_code/product catalog:
medical_exempt | reduced_9 | standard_19. Invoice lines default to the
catalog item's class, with manual override allowed for the billing
clerk.

10.5.3 Generate invoices as PDF with all DGI mandatory mentions. Use
react-pdf or @react-pdf/renderer. The PDF includes: invoice number
(sequential per tenant per year), issue date, supplier identity (clinic
name, NIF, NIS, RC), patient identity, line descriptions (ar-DZ and
fr-DZ), unit price HT, TVA rate, line total HT, line total TVA, line
total TTC, totals.

10.5.4 Implement the cash drawer session: opened_at, closed_at,
opening_balance, expected_closing_balance, actual_closing_balance,
discrepancy_amount. The receptionist opens the drawer at start of day,
logs cash payments against it, and closes it at end of day with a
counted actual balance.

10.6 — Wire Real-Time Updates (Socket.IO)

10.6.1 Install Socket.IO in apps/api: pnpm --filter @clinic-saas/api add
@socket.io/redis-adapter socket.io. Configure the adapter with the
Upstash Redis URL (or local Redis in dev).

10.6.2 Emit events on appointment status changes:
socket.to(`clinic-${tenantId}`).emit('appointment:updated',
appointment). The receptionist dashboard and the waiting-room display
subscribe to these events and update in real time.

10.6.3 Build a waiting-room display page
(apps/web/src/app/[locale]/(app)/waiting-room/page.tsx) intended for a
TV in the waiting room: large-font 'Now serving patient X' display,
updated via Socket.IO.

Phase 10 — Verification

Sign in as a clinic_admin. Create a patient. Book an appointment for
that patient. Start an encounter; enter a SOAP note, vitals, an allergy.
Add a dental finding on tooth 16 (FDI) with surfaces MOD (bitfield 7).
Generate an invoice with one TVA-exempt medical line and one 19%
non-medical line; verify the totals compute correctly. Download the
invoice PDF and verify all DGI mentions are present. Verify the
audit_log contains an entry for every mutation. Verify the waiting-room
display updates when the appointment status changes.

Phase 11 — Algerian Integrations (Chargily Pay, SMS, E-Invoicing Schema)

This phase wires the three Algerian-specific integrations the MVP needs:
Chargily Pay for card payments (CIB + Edahabia), an SMS gateway for
appointment reminders, and the e-invoicing schema future-proofing
(Algeria's e-invoicing mandate is expected 2027; the invoice schema
already stores all DGI mandatory mentions from day 1). All three
integrations process no patient-identifiable clinical data — only phone
numbers (SMS), invoice amounts (payment), and invoice metadata
(e-invoicing).

11.1 — Chargily Pay Integration

11.1.1 Sign up at chargily.com/business/pay. Choose the Startup tier
(free, 0% commission) for the first month. Obtain the API key from the
dashboard. Store in Doppler: CHARGILY_API_KEY, CHARGILY_WEBHOOK_SECRET.

11.1.2 Install the Chargily Pay SDK (or use the REST API directly): pnpm
--filter @clinic-saas/api add chargily-pay-js (or implement the
three-endpoint flow: POST /checkout, GET /checkouts/{id}, webhook
signature verification).

11.1.3 Create
apps/api/src/modules/billing/payment-providers/chargily.adapter.ts
implementing the PaymentProvider interface (per source §4.1.3 strategy
pattern). The adapter exposes: createCheckout(invoiceId, amountDZD,
returnUrl) → checkoutUrl; verifyWebhook(payload, signature) → boolean;
getCheckoutStatus(checkoutId) → 'paid' | 'pending' | 'failed'.

11.1.4 Create the webhook receiver at
apps/api/src/modules/billing/webhooks/chargily.route.ts. Verify the
signature using CHARGILY_WEBHOOK_SECRET before any processing. Respond
200 immediately, then enqueue the payment reconciliation via Inngest.

11.1.5 Add a CashAdapter and a TPEAdapter (in-clinic card terminal) to
the PaymentProvider strategy. The receptionist can record a cash or TPE
payment manually; only Chargily Pay is fully automated.

11.2 — SMS Gateway Integration

11.2.1 Sign up at bulkgate.com (recommended for MVP — transparent
per-route pricing). Obtain the API key. Register a custom Sender ID
(e.g., 'CLINICX') with each Algerian MNO (Mobilis, Djezzy, Ooredoo) —
this is mandatory; generic Sender IDs are rejected. The registration
takes 1-2 weeks.

11.2.2 Store in Doppler: BULKGATE_API_KEY, SMS_SENDER_ID. Configure the
SMS service in apps/api/src/modules/notifications/sms.service.ts with a
SmsProvider interface and a BulkGateAdapter implementation.

11.2.3 Create an Inngest function
apps/worker/src/functions/send-appointment-reminder.ts that fires 24
hours before an appointment, sends an SMS via BulkGate, and logs the
result. The SMS body contains only the appointment time and clinic name
— no diagnosis or treatment details.

11.2.4 Add a manual 'Send reminder' button on the appointment detail
page for the receptionist to trigger an immediate reminder.

11.3 — E-Invoicing Schema Future-Proofing

11.3.1 The invoice schema from Phase 10.5 already stores all DGI
mandatory mentions. Add an e_invoice_log table: id, tenant_id,
invoice_id, status (pending|submitted|accepted|rejected), submission_id,
submitted_at, response_payload JSONB. This table is dormant until the
e-invoicing mandate lands.

11.3.2 Add a /api/invoices/{id}/e-invoice-xml endpoint that generates
the DGI-compliant XML (or the future mandated format) from the invoice
data. The endpoint is internal (clinic_admin only) and is the stub for
future DGI submission.

11.4 — Test the Integrations in Staging

11.4.1 Use Chargily Pay's sandbox/test mode for end-to-end payment
testing. Create an invoice, initiate payment, complete the test
checkout, verify the webhook fires and the payment is recorded.

11.4.2 Send a test SMS to the operator's phone via BulkGate. Verify
delivery and the Sender ID display.

11.4.3 Generate the e-invoice XML for a sample invoice and validate it
against the DGI schema (when published). Until the mandate lands, the
XML is informational only.

Phase 11 — Verification

In staging: create an invoice, pay via Chargily Pay sandbox, verify the
webhook updates the invoice status to 'paid'. Send a test SMS — it must
arrive with the custom Sender ID. Generate the e-invoice XML — it must
contain all DGI mandatory mentions. Verify no patient-identifiable
clinical data (diagnosis, treatment) is sent to Chargily or BulkGate —
only invoice amounts and phone numbers.

Phase 12 — Observability on Free Tiers (Sentry, PostHog, Better Stack, Grafana Cloud)

An unobservable system is unoperable. This phase wires four signals —
errors, product analytics, uptime, and metrics/logs/traces — to
free-tier backends. The principle: every error a user encounters is
captured automatically, every page view is tracked, every uptime drop
pages the operator, and every request can be traced. All on free tiers,
all with strict PII scrubbing to comply with Law 18-07.

12.1 — Sentry (Error Tracking)

12.1.1 Create a Sentry project at sentry.io (Developer plan — free,
5,000 errors/month, 50 replays/month). Choose the Next.js platform for
apps/web and the Node platform for apps/api. Copy the DSNs.

12.1.2 Install: pnpm --filter @clinic-saas/web add
@sentry/nextjs@10.63.0 and pnpm --filter @clinic-saas/api add
@sentry/node@10.63.0. Run npx sentry-wizard@latest -i nextjs in apps/web
— the wizard creates sentry.client.config.ts, sentry.server.config.ts,
sentry.edge.config.ts, instrumentation.ts, and wraps next.config.ts.

12.1.3 Configure PII scrubbing in sentry.server.config.ts: Sentry.init({
beforeSend(event) { return scrubPii(event); }, ... }) where scrubPii
strips patient names, NINs, phone numbers, addresses, and emails from
exception messages and request bodies. This is non-negotiable for Law
18-07 compliance.

12.1.4 Set tracesSampleRate: 0.1 in production (10% of traces — Sentry
Developer gives 10k performance spans/month). Enable Replay:
replaysSessionSampleRate: 0.01, replaysOnErrorSampleRate: 1.0 — capture
1% of sessions but 100% of sessions with errors.

12.2 — PostHog (Product Analytics)

12.2.1 Create a PostHog project at posthog.com (Cloud Free — 1M
events/month, 5k session recordings). Copy the project API key.

12.2.2 Install: pnpm --filter @clinic-saas/web add posthog-js
posthog-js/react. Wrap the app in <PostHogProvider> in
apps/web/src/app/providers.tsx.

12.2.3 Define the key events: sign-up, sign-in, appointment-booked,
encounter-started, invoice-generated, payment-completed. Build the core
dashboards: activation funnel (sign-up → first appointment → first
encounter), retention cohort, feature adoption.

12.2.4 Configure PostHog PII scrubbing: in the PostHog UI, set 'property
denylist' to strip patient_name, patient_nin, patient_phone from events.
PostHog is hosted outside Algeria (US/EU) — only aggregated,
non-identifying events may be sent.

12.3 — Better Stack (Uptime Monitoring)

12.3.1 Create a Better Stack account at betterstack.com (Free — 10
monitors, 1 status page, 3 on-call seats).

12.3.2 Add three monitors against staging (production monitors are added
in Phase 16): (1) HTTPS GET https://clinic-saas-staging.vercel.app/ —
expect 200, timeout 5s, every 1 min; (2) HTTPS GET
https://clinic-saas-staging.vercel.app/api/health — expect 200 with
db:up, every 1 min; (3) HTTPS GET a known deep route — expect 200, every
5 min. Monitor from at least three geographic regions (including one
close to Algeria — Europe regions).

12.3.3 Configure escalation: monitor down → wait 1 minute → notify
#incidents Slack and email the operator. (Free Better Stack has limited
on-call; for phone paging, upgrade to a paid tier or use PagerDuty Free
for individuals.)

12.4 — Grafana Cloud (Metrics, Logs, Traces)

12.4.1 Create a Grafana Cloud account at grafana.com (Free — 3
dashboards, 10k metrics series, 50GB logs, 50GB traces). Create a stack
in the EU region (closest to Algeria).

12.4.2 Install the Grafana Alloy agent (or use OpenTelemetry SDK
directly) in apps/api. Configure it to send: NestJS metrics (request
count, latency histogram, error rate) via Prometheus remote_write;
structured logs via Loki; traces via Tempo. Use the Grafana Cloud
provided URLs and credentials.

12.4.3 Important: Grafana Cloud is hosted outside Algeria. Only
aggregated metrics, sanitized logs (no patient data), and trace metadata
may be sent. The EgressGuard from Phase 5.6 enforces this at the
application layer; double-check the Grafana Alloy config does not
include request bodies or patient identifiers.

12.5 — Set Up the Public Status Page

12.5.1 In Better Stack, create a status page at
status.clinic-saas.example.dz (use a different subdomain than the app).
Add the three monitors as components. Display historical uptime for the
last 90 days.

12.5.2 Host the status page on a different provider than the app — the
status page is on Better Stack, the app will be on CERIST Cloud. This
ensures the status page is reachable when the app is not.

12.6 — Write the On-Call Runbook

12.6.1 Complete docs/runbooks/incident-response.md covering the top five
incident types: DB connection exhaustion, auth provider outage (Better
Auth is self-hosted — it does not 'outage' unless Postgres does),
deployment regression, CDN/WAF misconfiguration, Chargily Pay or
BulkGate outage. Each entry: symptoms, diagnosis steps, mitigation,
rollback command.

12.6.2 Add the breach-response runbook (docs/runbooks/breach-response.md
from Phase 2.4.4) to the on-call documentation. The 5-day ANPDP breach
notification SLA is the most critical operational deadline.

Phase 12 — Verification

Trigger a deliberate error on staging (throw new Error('test') in a
route handler) — within 30 seconds the error must appear in Sentry with
a de-minified stack trace. Make a request and confirm the trace appears
in Grafana Cloud Tempo. Visit the staging app and confirm PostHog
records the page view. Take down the staging health endpoint temporarily
— Better Stack must alert within 2 minutes. Visit
status.clinic-saas.example.dz — the incident must be displayed.

Phase 13 — Security & Compliance Hardening (CSP, PII Scrubbing, RLS Tests, Audit Integrity)

Hardening is the difference between a deploy that works and a deploy
that survives. This phase runs the security audits, tightens the CSP,
verifies PII scrubbing, re-runs the RLS tests, and confirms the
audit-log hash chain integrity. Every finding here is cheaper to fix now
than after the ANPDP inspects.

13.1 — Run the Security Audit

13.1.1 Run pnpm audit --audit-level=moderate — there must be zero
moderate-or-higher vulnerabilities in production dependencies. Fix any
that exist.

13.1.2 Run the CodeQL analysis (already in CI from Phase 7.7) on the
main branch and triage every alert. Suppress only with an explicit
justification comment.

13.1.3 Run an external security scan against the staging URL: use OWASP
ZAP (free) or Snyk Free. Triage every finding; the OWASP Top 10 must
show zero critical or high findings.

13.2 — Tighten the Content-Security-Policy

13.2.1 In apps/web/next.config.ts, add a headers() async function
returning per-route header overrides. Set on all routes:
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload,
X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy:
strict-origin-when-cross-origin, Permissions-Policy: camera=(),
microphone=(), geolocation=().

13.2.2 Add a Content-Security-Policy header. Use a per-request nonce
generated in middleware (Next.js 16 supports the nonce API that
auto-propagates to <Script nonce={...}> tags). The CSP: default-src
'self'; script-src 'self' 'nonce-{nonce}' 'strict-dynamic'
https://va.vercel-scripts.com https://app.posthog.com; style-src 'self'
'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'
data:; connect-src 'self' https://*.sentry.io https://*.posthog.com
https://*.grafana.net; frame-ancestors 'none'; base-uri 'self';
form-action 'self'; upgrade-insecure-requests.

13.2.3 Verify with securityheaders.com — must score A or A+. Cross-check
with the CSP Evaluator (csp-evaluator.withgoogle.com).

13.3 — Verify PII Scrubbing End-to-End

13.3.1 Trigger an error that includes a patient name in the exception
message (deliberately, in a test route). Confirm Sentry receives the
error but the patient name is scrubbed (replaced with [REDACTED] or
removed).

13.3.2 Confirm the EgressGuard logs any attempt to send a personal-data
field to a non-Algerian host. Verify the guard is in 'block' mode in
production.

13.3.3 Confirm PostHog events do not contain patient_name, patient_nin,
or patient_phone properties. Check the PostHog live events feed.

13.4 — Re-Run the RLS and Audit-Log Tests

13.4.1 Run the RLS test suite (Phase 4.6.1) against a fresh copy of the
staging database. All tests must pass.

13.4.2 Run the audit-log immutability test (Phase 4.6.2) — UPDATE and
DELETE must be denied to app_role.

13.4.3 Run the audit-log hash-chain integrity check: a script that reads
every audit_log row in order, recomputes hash_curr from (hash_prev ||
canonical JSON of this row), and asserts it matches the stored
hash_curr. Any mismatch indicates tampering or a bug.

13.5 — Run the ANPDP Compliance Self-Audit

13.5.1 Work through the source blueprint's §12.3 ANPDP Compliance
Checklist. Confirm: prior declaration to ANPDP filed (or in progress);
DPO designated; processing register maintained (the audit_log table
serves as the operation log); DPIA completed (docs/dpia.md); written
processor contracts with sub-processors (Chargily, BulkGate, Vercel,
GitHub — only non-personal data); breach-response runbook in place;
data-subject-rights workflow implemented.

13.5.2 Confirm the data residency: all patient-identifiable data resides
on Algerian sovereign infrastructure (in production — Phase 15) or on
local Docker (in development). No patient data on Vercel, Neon, Sentry,
PostHog, Better Stack, or Grafana Cloud.

Phase 13 — Verification

pnpm audit must show zero moderate-or-higher vulnerabilities. CodeQL
must show zero unresolved alerts. securityheaders.com must score A+. The
PII scrubbing test must show patient names redacted in Sentry. The RLS
tests must pass. The audit-log hash-chain integrity check must pass. The
ANPDP compliance self-audit must show every item addressed or in
progress.

Phase 14 — Pre-Production Hardening (k6 Load Test, Accessibility Audit, DR Drill)

This phase runs the load tests, the full accessibility audit, and the
disaster-recovery drill that expose weaknesses before users do. Every
finding is cheaper to fix now than after go-live. The phase produces a
launch-readiness checklist that must be signed off before Phase 16
(production cutover).

14.1 — Run the Load Test

14.1.1 Install k6 v2.1.0: brew install k6 (macOS) or use the
grafana/k6:2.1.0 Docker image in CI. Write apps/api/load-test/smoke.js:
5 VUs for 1 minute, hitting /api/health, /api/auth/me, /api/patients
(with auth). Thresholds: http_req_duration p(95) < 500ms,
http_req_failed < 1%.

14.1.2 Write apps/api/load-test/load.js: ramp to 50 VUs over 2 minutes
(simulating 50 concurrent clinic users), hold 5 minutes, ramp down 2
minutes. Same thresholds.

14.1.3 Run k6 run load.js against the staging URL. The test must pass —
if it fails, identify the bottleneck (DB queries, N+1, missing indexes,
serverless cold starts) and fix.

14.1.4 Run a soak test: 20 VUs for 30 minutes. Watch for memory leaks,
DB connection creep, and slow degradation. Any drift in response time
over the soak indicates a leak.

14.2 — Run the Full Accessibility Audit

14.2.1 Run the Playwright axe scan (Phase 6.6) on every public page in
both locales. Every serious or critical violation must be fixed before
launch.

14.2.2 Run a manual keyboard-only test: unplug the mouse, navigate the
entire app. Every action reachable by mouse must be reachable by
keyboard. Verify the focus order is logical.

14.2.3 Test with a screen reader (VoiceOver on macOS, NVDA on Windows).
The page structure must be announced correctly (landmarks, headings,
form labels) in both French and Arabic.

14.3 — Run the Disaster-Recovery Drill

14.3.1 In development, simulate a DR scenario: stop the primary Postgres
container (docker compose stop postgres), restore from the latest
pgBackRest backup to a fresh container, verify data integrity. Time the
restore — this is the Recovery Time Objective (RTO).

14.3.2 Document the RPO (Recovery Point Objective — the max data loss,
typically the backup interval) and RTO in
docs/runbooks/backup-recovery.md. Target: RPO ≤ 15 minutes (continuous
WAL archive), RTO ≤ 4 hours.

14.3.3 Run a breach-response tabletop exercise: the operator walks
through a simulated incident (e.g., 'a clinic laptop is stolen with
active session credentials'). Every step of the breach-response runbook
(Phase 2.4.4 / source §11.3) is executed in slow motion. Time the
exercise — target under 30 minutes to ANPDP notification draft.

14.4 — Sign Off the Launch Readiness Checklist

14.4.1 Create docs/LAUNCH_CHECKLIST.md with every item from Phases 13
and 14 marked complete or explicitly accepted with a risk note. The
operator (as tech lead, product owner, and DPO) must sign off in writing
(a PR comment is sufficient). No item may be deferred to 'post-launch'.

Phase 14 — Verification

The load test must pass the smoke and load scenarios; the soak test must
show no drift. The accessibility audit must show zero serious or
critical violations in both locales. The DR drill must succeed and its
time must be recorded. The breach-response tabletop must complete within
30 minutes. The launch checklist must be signed.

Phase 15 — Local Clinic Server Setup (Primary Production Path)

This phase provisions, secures, and deploys the production stack on a
dedicated server physically located in the clinic. This path satisfies
Law 18-07's Algerian-residency requirement at near-zero monthly
recurring cost: a one-time hardware outlay of ~€1,000–1,500 (mini-PC,
UPS, encrypted HDDs) plus ~€10–35/month for offsite backup. The
multi-VPS sovereign-cloud topology from the source blueprint §6.3
(~€640/month) remains available as an alternative for operators who
prefer managed infrastructure; it is documented briefly at the end of
this phase. The trade-off of local hosting is operational: the operator
owns the hardware, the power backup, and the physical security. The
PWA's offline-first design (Phase 9) means the clinic continues to
operate during server downtime — tablets queue mutations and sync on
recovery.

15.1 — Hardware Procurement and Physical Setup

15.1.1 Procure a dedicated mini-PC or small tower server. Recommended
specifications: 8-core Intel N100/N305 or AMD Ryzen 5, 32 GB DDR5 RAM
(ECC preferred but not required), 1 TB NVMe SSD for the database + app,
plus a second 1 TB SSD for local backup staging. Suitable options:
Beelink EQ12 (~€400), Intel NUC 13 Pro (~€700), used Dell OptiPlex Micro
from refurbishers (~€300–500). For a 2-clinic, ~120-patients/day/clinic
load, 32 GB RAM and 8 cores is generous headroom; Postgres + Redis +
NestJS + Next.js + Orthanc idle at ~4 GB RAM and peak at ~12 GB under
load.

15.1.2 Procure a UPS (Uninterruptible Power Supply) rated for the
server's draw plus 30 minutes runtime. APC Back-UPS Pro 1500VA or
CyberPower CP1500AVRLCD (~€200). Algerian clinics have frequent short
outages; the UPS lets the server ride out a 15–30 minute outage or shut
down cleanly via apcupsd.

15.1.3 Procure two encrypted external HDDs for offsite backup rotation
(~€80 each, 2–4 TB). One stays connected to the clinic server for
nightly local backup; the other is the rotation target (kept at the
second clinic, in a bank safe deposit box, or at the operator's home).
The 3-2-1-1-0 backup rule requires at least one offsite copy — the
second HDD satisfies this.

15.1.4 (Optional, for warm DR standby) Provision one CERIST Cloud VPS
Small (~€20/month, 2 vCPU 4GB RAM) as a Postgres streaming-replica
standby. This is the single largest production recurring cost; it is
optional but recommended for sub-30-minute RTO. Without it, RTO is
~24–48 hours (restore from offsite HDD to a spare mini-PC).

15.1.5 Physically install the server in the clinic's back office or a
locked network cabinet. Connect it to the clinic's existing FTTH router
via Ethernet (not Wi-Fi). Connect the UPS. Power on. Document the
physical location and the hardware serial numbers in
docs/ops/hardware-inventory.md.

15.2 — OS Installation and Baseline Hardening

15.2.1 Install Ubuntu Server 24.04 LTS (or Debian 12). Use the minimal
server image (no desktop environment). During install: enable OpenSSH
server, create a non-root admin user with SSH key authentication
(generate a strong ED25519 key pair and add the public key to
~/.ssh/authorized_keys), disable password authentication for SSH in
/etc/ssh/sshd_config (PasswordAuthentication no).

15.2.2 Update the system and install baseline tools: sudo apt update &&
sudo apt upgrade -y && sudo apt install -y ufw fail2ban
unattended-upgrades curl git htop iotop.

15.2.3 Configure the firewall: sudo ufw default deny incoming && sudo
ufw default allow outgoing && sudo ufw allow from 192.168.1.0/24 to any
port 22 (SSH from clinic LAN only — replace with the actual clinic
subnet) && sudo ufw enable. Verify: sudo ufw status verbose. Note:
Cloudflare Tunnel (Phase 15.4) is outbound-only, so NO inbound
HTTP/HTTPS ports need to be opened.

15.2.4 Configure fail2ban to ban SSH brute-force attempts: defaults are
fine. Enable: sudo systemctl enable fail2ban && sudo systemctl start
fail2ban.

15.2.5 Enable automatic security updates: sudo dpkg-reconfigure -plow
unattended-upgrades. This patches the OS for CVEs without operator
intervention.

15.2.6 Configure LUKS full-disk encryption on the data volume containing
the database. The Ubuntu installer supports this at install time. Choose
a strong passphrase and store it in Doppler AND in a physical safe (not
on the server itself — if the server is stolen, the passphrase must be
recoverable).

15.2.7 Install and configure apcupsd for the UPS: sudo apt install -y
apcupsd. Edit /etc/apcupsd/apcupsd.conf for the UPS model (UPSCABLE usb,
UPSTYPE usb, DEVICE /dev/hiddev0). Set TIMEOUT 300 (shutdown after 5
minutes on battery) or BATTERYLEVEL 30 (shutdown when battery hits 30%).
Enable: sudo systemctl enable apcupsd && sudo systemctl start apcupsd.
Test by unplugging the UPS — the server must log the event and shut down
cleanly within the configured threshold.

15.3 — Install Docker and the Service Stack

15.3.1 Install Docker Engine and Docker Compose: follow
docs.docker.com/engine/install/ubuntu. Add the admin user to the docker
group: sudo usermod -aG docker $USER (re-login to take effect). Verify:
docker run hello-world.

15.3.2 Create the production directory structure: sudo mkdir -p
/opt/clinic-saas/{web,api,worker,postgres,redis,orthanc,backups,logs,caddy}
&& sudo chown -R $USER:$USER /opt/clinic-saas.

15.3.3 Create /opt/clinic-saas/docker-compose.yml with the production
services: postgres (image postgres:17-alpine, restart: always, volume
/opt/clinic-saas/postgres:/var/lib/postgresql/data, env_file
/opt/clinic-saas/.env.production), redis (image redis:7-alpine, restart:
always, volume /opt/clinic-saas/redis:/data), api (built from the repo's
apps/api/Dockerfile, restart: always, depends_on postgres redis,
env_file /opt/clinic-saas/.env.production), worker (same image as api,
command overridden to run the worker entrypoint, restart: always), web
(Next.js standalone image, restart: always), orthanc (image
orthancteam/orthanc:latest, restart: always, volume
/opt/clinic-saas/orthanc:/var/lib/orthanc). All services on a private
Docker network; only Caddy exposes ports 80 and 443 to localhost.

15.3.4 Configure the production Postgres: edit
/opt/clinic-saas/postgres/postgresql.conf (mount it into the container)
to set shared_buffers = 8GB (25% of 32GB RAM), effective_cache_size =
24GB (75%), work_mem = 32MB, maintenance_work_mem = 1GB, wal_level =
replica, max_wal_senders = 5 (for the optional DR replica),
random_page_cost = 1.1, checkpoint_completion_target = 0.9,
max_connections = 100. Restart the Postgres container.

15.3.5 Create the production Postgres roles inside the container: docker
exec -it clinic-saas-postgres-1 psql -U postgres -c "CREATE ROLE
ops_superuser WITH BYPASSRLS LOGIN PASSWORD '<from-doppler>';" and -c
"CREATE ROLE app_role NOBYPASSRLS LOGIN PASSWORD '<from-doppler>';".
Grant the schema privileges to app_role per Phase 4.2.1. Verify app_role
does NOT have BYPASSRLS: docker exec -it clinic-saas-postgres-1 psql -U
postgres -c "\du app_role" — the attributes column must NOT list
BYPASSRLS.

15.4 — Reverse Proxy and Cloudflare Tunnel (No Inbound Ports)

15.4.1 Install Caddy as the reverse proxy via a docker-compose service.
The Caddyfile at /opt/clinic-saas/Caddyfile routes app.clinic-saas.dz →
web:3000 and api.clinic-saas.dz → api:3001. Caddy auto-provisions TLS
certificates from Let's Encrypt. Add the security headers (HSTS,
X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy,
Permissions-Policy) and the CSP header (Phase 13.2) in the Caddyfile.

15.4.2 Install Cloudflare Tunnel (cloudflared): docker run -d --name
cloudflared --restart always --network clinic-saas_default
cloudflare/cloudflared:latest tunnel --no-autoupdate run. Authenticate
via the Cloudflare dashboard: wrangler login (run from the operator's
workstation, not the clinic server) or use the dashboard UI at
one.dash.cloudflare.com to create a tunnel named clinic-saas-prod.

15.4.3 Configure the tunnel's ingress rules: app.clinic-saas.dz →
http://caddy:80, api.clinic-saas.dz → http://caddy:80. The tunnel is
outbound-only — the clinic server makes a persistent outbound connection
to Cloudflare's edge; no inbound ports need to be opened on the clinic's
router. The clinic server sits behind NAT; Cloudflare Tunnel handles the
connectivity transparently.

15.4.4 In Cloudflare DNS, set app.clinic-saas.dz and api.clinic-saas.dz
as CNAMEs to <tunnel-uuid>.cfargotunnel.com. Set the proxy ON (orange
cloud) for WAF and DDoS protection.

15.4.5 Verify from outside the clinic (e.g., from the operator's phone
on mobile data): curl -I https://app.clinic-saas.dz/ must return 200
with TLS 1.3. The request flows: mobile → Cloudflare edge → Cloudflare
Tunnel (outbound from clinic server) → Caddy → Next.js container.

15.5 — Configure Cloudflare WAF

15.5.1 In Cloudflare → Security → WAF, enable the OWASP Managed Ruleset
and the Cloudflare Managed Ruleset. Set sensitivity to High.

15.5.2 Add custom WAF rules: block requests to /xmlrpc.php and /.env
(return 403); rate-limit /api/auth/* to 10 requests per minute per IP
(complements the application-level rate limit from Phase 6.7).

15.5.3 Configure cache rules: bypass cache on /api/*, cache everything
on /_next/static/* (edge cache for 1 year, honoring Next.js's immutable
cache headers). Enable Bot Fight Mode (free).

15.6 — Apply Database Migrations and Seed

15.6.1 From a clean checkout on the operator's workstation, set the
production DIRECT_URL in the environment (from Doppler): export
DIRECT_URL="postgresql://ops_superuser:<password>@<clinic-server-tailscale-ip>:5432/clinic_prod".
(Use a Tailscale mesh between the workstation and the clinic server for
secure access to the Postgres port — never expose Postgres to the
internet.)

15.6.2 Run pnpm --filter @clinic-saas/db db:migrate. This applies every
pending migration in order to the production Postgres on the clinic
server.

15.6.3 Verify: pnpm --filter @clinic-saas/db exec drizzle-kit status
--url "<production pooled url>" — must report 'Database schema is up to
date'.

15.6.4 Run the Phase 4.6 RLS test suite against the production database
(with a temporary test tenant). All tests must pass. This is the last
verification that RLS is enforced in production before any patient data
is written.

15.6.5 Seed the production database with the first clinic (the
operator's clinic), the clinic_admin user, and the RBAC role hierarchy.
Use the one-time seed script from Phase 4.5.3.

15.7 — Backup: 3-2-1-1-0 with Offsite Rotation

15.7.1 Install pgBackRest in a sidecar container or on the host.
Configure two repositories: repo1 local
(/opt/clinic-saas/backups/pgbackrest, fast for restores) and repo2
offsite. The offsite target is one of: (a) the second clinic's server
over a Tailscale mesh (free, sovereign, requires the second clinic to be
operational); (b) CERIST Cloud S3 (~€10/month for 100GB, Algerian,
ARPCE-authorized); (c) an encrypted external HDD rotated weekly to a
bank safe deposit box (~€30/year for the box). The recommended
combination is (a) or (b) for daily automated offsite, plus (c) for
weekly cold-storage insurance.

15.7.2 Configure AES-256-CBC encryption on both pgBackRest repositories.
The passphrase MUST be stored separately from the backup data — in the
OS keyring (pass or gnome-keyring), in Doppler, and on paper in a
physical safe. Never on the same server as the backup repository
(ransomware protection — if the server is encrypted, the backup
passphrase must be recoverable from elsewhere).

15.7.3 Configure the backup schedule: full backup Sunday 02:00 Algeria
time, differential every 6 hours, incremental hourly, WAL archive
continuous. RPO ≤ 15 minutes (continuous WAL archive). Verify with:
docker exec clinic-saas-pgbackrest-1 pgbackrest info.

15.7.4 (Optional DR replica) If using the CERIST VPS Small warm standby
(~€20/month): configure streaming replication. On the clinic server's
postgresql.conf, set wal_level = replica, max_wal_senders = 5. In
pg_hba.conf, allow replication connections from the CERIST VPS's
Tailscale IP only (never expose Postgres directly to the internet —
always via Tailscale or WireGuard). On the CERIST VPS, run pg_basebackup
-h <clinic-server-tailscale-ip> -U replicator -D
/var/lib/postgresql/data -P -R to seed, then start Postgres with
hot_standby = on. Verify the replica is receiving WAL: SELECT * FROM
pg_stat_replication; on the clinic server.

15.7.5 (If using the second-clinic HDD rotation) Configure a nightly
cron job: docker exec clinic-saas-pgbackrest-1 pgbackrest backup
--type=incr to the local repo, then rsync the encrypted backup files to
the second clinic's server over Tailscale: rsync -avz --delete
/opt/clinic-saas/backups/pgbackrest/
user@second-clinic-tailscale:/backups/clinic-saas/. Weekly, the operator
physically swaps one HDD to a bank safe deposit box.

15.8 — UPS and Power Management

15.8.1 Confirm apcupsd (installed in 15.2.7) is monitoring the UPS.
Verify the daemon is running: sudo systemctl status apcupsd. Test:
unplug the UPS from wall power; apcupsd must log the event in
/var/log/apcupsd.events and trigger a clean shutdown at the configured
battery threshold.

15.8.2 Configure Docker to restart all services on boot: every service
in docker-compose.yml has restart: always. The clinic server boots,
Docker starts, all services come back online within 60 seconds. Verify:
sudo reboot, wait 90 seconds, curl http://localhost:3001/api/health from
the server — must return 200.

15.8.3 Document the power-outage runbook in
docs/runbooks/power-outage.md: tablets continue working on battery (PWA
offline-first design from Phase 9), queue mutations in IndexedDB, sync
when the server returns. The clinic can operate for 24+ hours offline;
the only failure mode is the server not coming back, which triggers the
DR restore procedure (15.7.4 promote the CERIST replica, or 15.7.5
restore from the offsite HDD to a spare mini-PC).

15.9 — Observability on the Local Server

15.9.1 Decision point: run the observability stack locally (Grafana +
Loki + Prometheus in Docker on the clinic server) or use free-tier cloud
backends (Sentry Developer, Grafana Cloud Free, Better Stack Free) with
strict PII scrubbing. Both are compliant with Law 18-07 because the
EgressGuard (Phase 5.6) ensures no patient data leaves the clinic server
— only aggregated metrics, sanitized logs, and trace metadata go to the
cloud backends.

15.9.2 For the $0-ongoing-cost path: use Sentry Developer Free + Grafana
Cloud Free + Better Stack Free (configured in Phase 12). Accept the
free-tier limits (5k errors/month, 50GB logs, 10 monitors) and monitor
them. If a limit is hit, upgrade to a paid tier or self-host that
specific signal.

15.9.3 For maximum sovereignty (zero external telemetry egress): add a
Grafana + Loki + Prometheus stack to the clinic server's
docker-compose.yml. This consumes ~1–2 GB RAM and 10–50 GB disk/month of
logs. The operator accesses Grafana at grafana.clinic-saas.dz (via
Cloudflare Tunnel, behind Basic Auth or Better Auth). Sentry can also be
self-hosted on the same server (Sentry self-hosted is AGPLv3,
Docker-based, ~2 GB RAM). Trade-off: full sovereignty vs ~4 GB
additional RAM and operational burden.

15.10 — Configure Production Secrets

15.10.1 In Doppler, create a production config. Set every production
environment variable: DATABASE_URL
(postgresql://app_role:<password>@localhost:5432/clinic_prod — localhost
because the API container connects to the Postgres container on the same
Docker network; do NOT use a connection pooler for the local
single-server setup, connect directly — PgBouncer/Supavisor are only
needed at multi-VPS scale), DIRECT_URL
(postgresql://ops_superuser:<password>@localhost:5432/clinic_prod),
REDIS_URL (redis://redis:6379), AUTH_SECRET (openssl rand -base64 32),
CHARGILY_API_KEY, BULKGATE_API_KEY, SMS_SENDER_ID, SENTRY_DSN,
POSTHOG_KEY, GRAFANA_CLOUD_*.

15.10.2 Sync production secrets to the clinic server: doppler secrets
download --no-file --format=env --config=prd >
/opt/clinic-saas/.env.production (run from the operator's workstation,
then scp the file to the clinic server over Tailscale; or run doppler
directly on the clinic server if it is authenticated). Ensure
/opt/clinic-saas/.env.production is owned by root, mode 0600, and never
committed to git.

15.10.3 Restart all services to pick up the new secrets: docker compose
-f /opt/clinic-saas/docker-compose.yml up -d --force-recreate. Verify
the API connects to Postgres: curl http://localhost:3001/api/health must
return { status: 'ok', db: 'up' }.

Phase 15 — Verification

All services running on the clinic server (docker compose ps shows all
healthy). https://app.clinic-saas.dz reachable from outside the clinic
via Cloudflare Tunnel with a valid TLS 1.3 certificate. The production
Postgres is running with RLS (the Phase 4.6 test suite passes against
it). pgBackRest full backup completed successfully (pgbackrest info
shows the latest full backup). UPS test passed (unplug → clean shutdown
at threshold). The optional CERIST DR replica is connected (SELECT *
FROM pg_stat_replication shows the replica). Sentry, Grafana Cloud, and
Better Stack are receiving scrubbed telemetry. The EgressGuard is in
'block' mode. /api/health returns { status: 'ok', db: 'up' }.

+-----------------------------------------------------------------------+
| Critical — Never expose Postgres or the clinic server to the internet |
|                                                                       |
| Cloudflare Tunnel is outbound-only and works behind any NAT. NEVER    |
| use router port-forwarding to expose the clinic server's ports        |
| directly to the internet — it is an attack surface with no benefit.   |
| Postgres (port 5432) must be reachable only from the clinic server's  |
| Docker network and from the operator's workstation via a Tailscale    |
| mesh. If the optional CERIST DR replica is used, the replication      |
| connection also goes over Tailscale, never over the public internet.  |
| The single most common cause of clinic-server compromise is an        |
| exposed Postgres or SSH port; Cloudflare Tunnel + Tailscale           |
| eliminates this risk entirely.                                        |
+=======================================================================+
+-----------------------------------------------------------------------+

15.11 — Alternative Topology: Multi-VPS Sovereign Cloud (CERIST/Djezzy)

Operators who prefer managed infrastructure (no hardware to own, no UPS
to maintain, no physical security to manage) can deploy the same Docker
stack across 3–5 CERIST Cloud or Djezzy Cloud VPSes per the source
blueprint §6.3. The topology: VPS-1 (Frontend + Reverse Proxy), VPS-2
(Backend + Worker), VPS-3 (Database + Redis), VPS-4 (Imaging — Orthanc +
Djezzy Cloud OSS), VPS-DR (Disaster Recovery at Algérie Télécom
Constantine DC, streaming replica). Estimated cost: ~96,000 DZD/month
(~€640/month) for the full topology with DR and observability; ~71,000
DZD/month (~€475/month) for a minimal topology. The rest of the roadmap
(Phases 16, 17) is identical regardless of which production topology is
chosen — the cutover, smoke test, and post-deployment operations are
hosting-agnostic. The trade-off: ~€640/month vs ~€0/month (local
server), in exchange for no hardware ownership and managed DR.

+-----------------------------------------------------------------------+
| Note — PgBouncer and RLS at multi-VPS scale                           |
|                                                                       |
| If the multi-VPS sovereign-cloud topology is chosen, the app role     |
| connects to Postgres via PgBouncer (to pool connections across the    |
| VPS-2 ↔ VPS-3 network hop). PgBouncer in transaction-pooling mode     |
| breaks SET LOCAL session variables, which breaks the                  |
| TenantInterceptor. Use pool_mode=session, or adopt Supavisor/PgCat    |
| which support session vars in transaction mode. On the local          |
| clinic-server topology, no pooler is needed — the API connects        |
| directly to Postgres on the same Docker network, and the session-var  |
| mechanism works as designed.                                          |
+=======================================================================+
+-----------------------------------------------------------------------+

Phase 16 — Production Cutover (Migration, Deploy, Smoke Test, 24h Soak)

The production cutover is the moment the system becomes real. This phase
executes the cutover with the discipline of a flight checklist: every
step is performed in order, every step is verified before the next
begins, and the rollback option is always one command away. The cutover
is scheduled for a low-traffic window — typically a Sunday morning in
Algeria — early enough that the operator is fresh and the workday
remains for incident response.

16.1 — Apply the Production Database Migration

16.1.1 From a clean checkout on main on the operator's workstation, set
the production DIRECT_URL in the environment (from Doppler, via
Tailscale to the clinic server). Run pnpm --filter @clinic-saas/db
db:migrate. This applies every pending migration in order to the
production Postgres on the clinic server. (If Phase 15.6 already applied
the migrations, this step is a no-op — drizzle-kit migrate is
idempotent.)

16.1.2 Verify: pnpm --filter @clinic-saas/db exec drizzle-kit status
--url "<production pooled url>" — must report 'Database schema is up to
date'.

16.1.3 Seed the production database with the first clinic (the
operator's clinic), the clinic_admin user, and the RBAC role hierarchy.
Use a one-time seed script that is NOT idempotent (it must run exactly
once). If Phase 15.6.5 already ran the seed, skip this step.

16.2 — Build and Deploy the Production Images

16.2.1 On the operator's workstation, build the production Docker
images: docker build -t clinic-saas-api:$(git rev-parse --short HEAD) -f
apps/api/Dockerfile . && docker build -t clinic-saas-web:$(git rev-parse
--short HEAD) -f apps/web/Dockerfile . && docker build -t
clinic-saas-worker:$(git rev-parse --short HEAD) -f
apps/worker/Dockerfile .. Tag the images with the git SHA for
traceability.

16.2.2 Push the images to a registry the clinic server can pull from.
For $0 budget, use GitHub Container Registry (ghcr.io) — free for public
images, free for private with 500MB/month storage on GitHub Free. Tag
and push: docker tag clinic-saas-api:<sha>
ghcr.io/<org>/clinic-saas-api:<sha> && docker push
ghcr.io/<org>/clinic-saas-api:<sha>. Repeat for web and worker.

16.2.3 On the clinic server (over SSH via Tailscale), pull the new
images: docker pull ghcr.io/<org>/clinic-saas-api:<sha> && docker pull
ghcr.io/<org>/clinic-saas-web:<sha> && docker pull
ghcr.io/<org>/clinic-saas-worker:<sha>. Update
/opt/clinic-saas/docker-compose.yml to reference the new image tags.
Restart the services: docker compose -f
/opt/clinic-saas/docker-compose.yml up -d --force-recreate.

16.2.4 Smoke-test the API: from outside the clinic, curl
https://api.clinic-saas.dz/api/health must return 200 with db:up. From
the clinic server itself, curl http://localhost:3001/api/health must
also return 200 (confirms the container is healthy independent of
Cloudflare).

16.3 — Verify the Frontend

16.3.1 From outside the clinic, load https://app.clinic-saas.dz — the
app must load in both ar-DZ and fr-DZ. Verify the version in the footer
matches the deployed git SHA.

16.4 — Configure the Production Inngest Endpoint

16.4.1 In the Inngest dashboard, set the production endpoint URL to
https://api.clinic-saas.dz/api/inngest. Verify Inngest can reach the
endpoint and the SMS reminder function is registered.

16.5 — Verify the Production Stack End-to-End

16.5.1 Visit https://app.clinic-saas.dz — the app must load in both
ar-DZ and fr-DZ. Sign in as the clinic_admin. Create a patient. Book an
appointment. Start an encounter. Generate an invoice. Pay via Chargily
Pay (live mode now, not sandbox). Verify the payment webhook updates the
invoice.

16.5.2 Verify Sentry: trigger a deliberate error on production (a hidden
/api/smoke route that throws). The error must appear in Sentry within 30
seconds with a de-minified stack.

16.5.3 Verify Grafana Cloud: make a request and confirm the trace
appears in Tempo with the full span tree.

16.5.4 Verify Better Stack: confirm the production monitors report
all-green for app.clinic-saas.dz and /api/health.

16.5.5 Verify the on-call alerting: trigger a synthetic downtime (block
/api/health temporarily) and confirm the operator receives an alert
within 2 minutes. Restore the endpoint and confirm the recovery
notification.

16.5.6 Verify the DR replica (if configured): on the CERIST VPS, run
psql -c 'SELECT * FROM patient LIMIT 1' — the replica must have the data
created in 16.5.1 (async streaming replication may lag a few seconds).
If no DR replica is configured, verify the offsite backup instead:
docker exec clinic-saas-pgbackrest-1 pgbackrest info must show a recent
successful backup.

16.6 — Conduct the 24-Hour Soak

16.6.1 For the first 24 hours post-cutover, the operator watches the
dashboards actively. Every Sentry error is triaged; every Better Stack
alert is investigated.

16.6.2 At the 1-hour, 4-hour, and 24-hour marks, run the smoke test
suite against production (a Playwright suite tagged @smoke that runs
against the production URL). Any failure triggers an immediate incident.

16.6.3 At the 24-hour mark, hold a launch retrospective: what went well,
what surprised us, what to fix. Document the action items in
docs/RETRO-001.md.

Phase 16 — Verification

All production checks must pass: the app is reachable at
https://app.clinic-saas.dz with a valid SSL certificate; the database is
migrated and queryable; the DR replica is connected; Sentry, Grafana
Cloud, and Better Stack are receiving data; the WAF is active; the
on-call alerting has been verified by a synthetic downtime test. The
24-hour soak has completed with no untriaged errors. The launch
retrospective has been held.

+-----------------------------------------------------------------------+
| Critical — Always have rollback ready                                 |
|                                                                       |
| Before triggering the production deploy, identify the previous        |
| known-good state (the previous git SHA, the previous Docker image     |
| tags). If the smoke test fails, the rollback procedure is: (1) update |
| /opt/clinic-saas/docker-compose.yml to reference the previous image   |
| tags and docker compose up -d --force-recreate; (2) if a migration    |
| broke the DB, run the down-migration (drizzle-kit migrate with a      |
| negative step, or manually revert the SQL). Document the rollback     |
| procedure in docs/runbooks/rollback.md and test it on staging before  |
| the cutover. The local clinic-server topology makes rollback fast —   |
| there is one server to update, not a fleet.                           |
+=======================================================================+
+-----------------------------------------------------------------------+

Phase 17 — Post-Deployment Operations & ANPDP Compliance

Production is not a finish line; it is the start of operations. This
phase establishes the ongoing practices that keep the system healthy and
legally compliant: ANPDP filing (the operator's pre-go-live obligation
under Law 25-11), the on-call rotation, incident response, backup
verification, dependency patching, cost monitoring, and the quarterly
compliance self-audit.

17.1 — Complete the ANPDP Filing (Mandatory Pre-Go-Live)

17.1.1 Designate a Data Protection Officer (DPO). The operator can
designate themselves (internal DPO) or hire Algerian counsel (external
DPO). The DPO must have expert knowledge of data protection law and
cannot have a conflict of interest.

17.1.2 Prepare the DPO filing to ANPDP: full name, professional contact
details, qualifications, scope of responsibilities, processing register
summary. Submit via the ANPDP online platform (anpdp.dz) AND physically
at the ANPDP headquarters in Algiers (Cité Sahli, El Biar, Alger).
Retain the filing acknowledgment.

17.1.3 File the prior declaration (and prior authorization for health
data) with ANPDP before any patient data is processed. This is a
multi-month process — start it in Phase 0 of the next iteration (i.e.,
now, before scaling beyond the operator's own clinics). Budget 2–4 weeks
for the filing and 3–6 months for the authorization.

17.1.4 Complete the DPIA (Data Protection Impact Assessment) in
docs/dpia.md. The DPIA is mandatory for high-risk processing (sensitive
data at scale — health data qualifies). The DPIA documents: the
processing, the necessity and proportionality, the risks to data
subjects, and the mitigations.

17.2 — Establish the On-Call Rotation

17.2.1 For a solo operator, the on-call rotation is just the operator.
Configure Better Stack (or PagerDuty Free for individuals) to page the
operator's phone on SEV1 incidents. Set a 5-minute acknowledgment SLA.

17.2.2 Maintain docs/oncall-handoff.md (updated at every rotation, or
weekly for a solo operator): open incidents, flaky monitors, in-flight
migrations, recent deploys with elevated error rates, anything to watch.

17.3 — Define the Incident Response Process

17.3.1 Define severity levels: SEV1 (system down, all users affected —
page immediately, declare incident within 5 min, status page update
within 15 min, ANPDP breach notification within 5 days if personal data
is involved); SEV2 (major feature broken — page within 30 min); SEV3
(minor feature broken — fix in business hours).

17.3.2 Assign incident roles: Incident Commander (drives the response),
Communications (owns the status page), Resolver (the engineer fixing the
issue). For a solo operator, one person holds all three roles; document
the handoff procedure for when a second person joins.

17.4 — Write Postmortems for Every SEV1 and SEV2

17.4.1 Within 48 hours of resolution, write a postmortem in
docs/postmortems/<date>-<short-desc>.md. Sections: Summary, Impact
(users affected, duration), Timeline (UTC timestamps), Root Cause,
Contributing Factors, What went well, What went poorly, Action items
(with owners and due dates).

17.4.2 Postmortems are blameless — they describe what happened, not who
did it. The goal is systemic improvement. Track action items to
completion.

17.5 — Verify Backups Weekly

17.5.1 Schedule a weekly automated restore drill (a cron job on VPS-DR):
restore the most recent pgBackRest backup to a disposable database, run
a schema integrity check, report success/failure. A failed restore is a
SEV2 — backups are useless if they cannot be restored.

17.5.2 Quarterly, perform a full restore drill: restore to a fresh VPS,
run the Playwright smoke suite against a temporary app instance pointed
at the restored DB. Time the full restore — confirm the RTO has not
regressed.

17.6 — Patch Dependencies on a Cadence

17.6.1 Renovate (Phase 2.5) opens PRs for minor and patch updates.
Review and merge weekly. Major updates get manual review; do not let
them age past 30 days.

17.6.2 For security CVEs, Dependabot opens urgent PRs — merge within the
SLA: critical 24h, high 7d, moderate 30d. Subscribe to GitHub Security
Advisories for Next.js, Drizzle, Better Auth, NestJS.

17.7 — Monitor Cost

17.7.1 Set up billing alerts: CERIST Cloud / Djezzy Cloud (alert at 80%
of plan limits), Chargily Pay (monitor commission volume), BulkGate
(monitor SMS spend against the €3,000/year/clinic budget),
Sentry/PostHog/Grafana Cloud (alert at 80% of free-tier quotas — upgrade
or self-host when exceeded).

17.7.2 Monthly, review the bill from each provider. Investigate any
spike — a VPS CPU spike often signals a slow query; an SMS spend spike
often signals a reminder loop bug.

17.8 — Run the Quarterly Compliance Self-Audit

17.8.1 Quarterly, the DPO (the operator, in the solo case) walks through
the ANPDP compliance checklist (source §12.3): prior declaration
current, DPO registration current, processing register up to date, DPIA
current, processor contracts current, breach-response runbook tested,
data-subject-rights workflow functional, audit-log integrity verified,
RLS tests passing, EgressGuard in block mode.

17.8.2 Document the self-audit in docs/compliance/<year>-Q<quarter>.md.
Any gap gets a remediation ticket with a due date.

Phase 17 — Verification

The ANPDP filing is submitted (or in progress). The on-call rotation is
configured. The incident response process is documented and the operator
has walked through a tabletop. The weekly restore drill is scheduled and
passing. The quarterly compliance self-audit is scheduled. The system is
in steady-state operations and legally compliant under Law 18-07
(amended by Law 25-11) and Law 18-11.

Counterarguments & Limitations

“$0 budget is impossible for a clinic SaaS.”

False, with the local clinic-server topology adopted in v2.1. $0 ongoing
budget is achievable end-to-end. Phases 0–14 use free tiers exclusively
(GitHub Free, Vercel Hobby, Neon Free, Sentry Developer, PostHog Cloud
Free, Better Stack Free, Grafana Cloud Free, Resend Free, Upstash Redis
Free, Inngest Free, Doppler Free, Cloudflare Free). Phase 15
(production) on the local clinic-server topology costs a one-time
hardware outlay of ~€1,000–1,500 (mini-PC, UPS, encrypted HDDs) plus
~€10–35/month for offsite backup (CERIST S3 or second-clinic HDD
rotation). The optional CERIST VPS Small for warm DR adds ~€20/month.
Law 18-07 mandates that patient data reside in Algeria — it does NOT
mandate that the data reside on a cloud provider. A server physically
located in the clinic satisfies the residency requirement at near-zero
ongoing cost. The multi-VPS sovereign-cloud topology (~€640/month)
remains available for operators who prefer managed infrastructure, but
it is no longer the default. The honest framing: the only material
outlay is the one-time hardware; everything else is genuinely $0/month.

“AI agents are not reliable enough for a medical system.”

Valid concern. AI agents produce plausible code that violates the
architecture unless constrained. The mitigation built into this roadmap
is multi-layered: AGENTS.md (Phase 2.3) as the universal instruction
file read by every AI coding tool; the AI PR review bot (Phase 2.6,
provider of the operator's choice) as a second pair of eyes; the RLS CI
tests (Phase 4.6) that catch the most dangerous class of agent error
(missing FORCE RLS); the AuditInterceptor (Phase 5.5) that auto-captures
every mutation so agent-written code cannot silently bypass audit; the
EgressGuard (Phase 5.6) that blocks patient data from leaving the clinic
server regardless of what the agent wrote. The single biggest safeguard
is that no AI agent has production deploy access — the operator reviews
and merges every PR. The roadmap's discipline converts AI agents from a
risk into a workforce, regardless of which specific tool the operator
chooses.

“Why not Vercel for production too?”

Vercel is US-hosted (or EU-hosted, but not Algeria-hosted). Law 18-07
mandates Algerian sovereign hosting for patient-identifiable data.
Vercel Hobby (and Pro) cannot host the production clinic SaaS legally.
Vercel is used in this roadmap for development and staging previews only
(Phases 7–14); production (Phase 15–16) deploys to CERIST Cloud / Djezzy
Cloud. The source blueprint's §18.4 addresses this counterargument in
detail.

“The operator cannot be the DPO.”

Law 25-11 mandates a DPO for any organization processing sensitive
personal data at scale. The DPO can be internal (a staff member) or
external (Algerian counsel or a consultancy) and must not have a
conflict of interest. The operator designating themselves as DPO is
permissible if the operator has data-protection training and the DPO
role does not conflict with the operator's other roles (CEO, CTO,
clinician). The conflict-of-interest test is the gate: if the operator
also decides how data is processed (which they do, as the architect), an
external DPO is safer. The source blueprint's §3.1.5 recommends
budgeting for DPO training if designating internally.

“Supabase would be faster than self-hosted Postgres + Better Auth.”

True for development speed, false for legal compliance. Supabase's
managed offering is hosted in AWS regions outside Algeria; self-hosting
Supabase is operationally heavy (12+ containers). The source blueprint's
§18.4 addresses this: the architectural choice is self-hosted Postgres
on CERIST/Djezzy Cloud + Better Auth (self-hosted) + S3-compatible
sovereign storage. This is more work than Supabase but is the legally
safe path. Supabase Free IS used in this roadmap for development
database parity (Phase 4.7 alternative) — but never for production.

“This is overkill for a two-clinic MVP.”

The most common objection. The counter-position is that a clinic MVP
should ship in 48 hours with minimal infrastructure. This is true for a
throwaway prototype — but the moment the prototype acquires real patient
data, the cost of retrofitting RLS, audit logging, ANPDP compliance, and
breach-response capability onto a system that never had them exceeds the
cost of building them in from the start. The roadmap's phases are
modular: a true throwaway can collapse Phases 4, 8, 9, 12, 13, 14 to
their bare minimums. The phases that must never be skipped are Phase 0
(governance), Phase 2 (AGENTS.md + rulesets), Phase 4 (RLS), Phase 5
(audit + egress guard), and Phase 15–16 (verified sovereign cutover) —
these prevent irreversible legal and data-leak mistakes.

Limitations of This Roadmap

This roadmap does not cover: the operator's specific AI agent
orchestration tooling (deferred per the source blueprint §2.3); clinical
content design (treatment protocols, drug formularies); CNAS/CASNOS
electronic billing (no public API exists; Phase 11 of the source
blueprint); FHIR export (Phase 10 of the source blueprint, deferred);
the patient portal (Phase 12+ of the source blueprint, deferred);
telemedicine (Phase 13+ of the source blueprint, deferred); advanced
imaging workflows beyond MVP Orthanc integration; multi-region
active-active deployment (the roadmap deploys single-region Algerian
primary + DR); and large-scale data pipelines. Teams facing these
constraints should treat this roadmap as the foundation and extend it
with the source blueprint's corresponding phases.

Conclusion & Implications

The premise of this roadmap is that a Law-18-07-compliant,
Algerian-sovereign-hosted clinic SaaS can be built from absolute zero to
production cutover by a single operator using AI agents on a $0
development budget, in 17 sequenced phases of atomic, verifiable steps.
Each phase performs one load-bearing task: Phase 0 fixes the GitHub
foundation; Phase 1 fixes the toolchain; Phase 2 fixes the governance;
Phase 3 fixes the architecture; Phase 4 fixes the data layer and RLS;
Phase 5 fixes the perimeter (auth, audit, egress); Phase 6 fixes the
bilingual RTL UX; Phase 7 fixes the assembly line; Phase 8 fixes the
executable specification; Phase 9 fixes offline resilience; Phase 10
fixes the domain modules; Phase 11 fixes the Algerian integrations;
Phase 12 fixes observability; Phase 13 fixes security; Phase 14 fixes
launch readiness; Phase 15 fixes the sovereign infrastructure; Phase 16
fixes the cutover; Phase 17 fixes the ongoing compliance. Skip a phase
and the load it carries shifts to a later phase, where it costs more —
usually during an ANPDP inspection or a patient-data incident.

The implications for the operator are concrete. First, the $0 ongoing
budget is real and sufficient end-to-end, including production: the
local clinic-server topology (Phase 15) reduces the production running
cost from ~€640/month (multi-VPS sovereign cloud) to ~€10–35/month
(offsite backup only), with a one-time hardware outlay of ~€1,000–1,500
as the only material cost. Second, the AI-agent workflow is viable for a
medical system only because the roadmap enforces the architecture at
multiple layers (AGENTS.md, AI PR review, RLS CI tests,
AuditInterceptor, EgressGuard) — without these layers, agent-written
code is a compliance liability; with them, it is a productive workforce,
regardless of which specific AI tool the operator chooses. Third, the
Algerian regulatory environment is not an obstacle but a design
constraint that produces a better system: the RLS + audit-log +
egress-guard + local-hosting combination is more secure and more
auditable than a typical US-hosted SaaS, and the ANPDP filing process
forces the operator to think through breach response before the breach
happens.

Looking forward, the most consequential trends for the next 12 months
are: the maturation of AI coding agents which will reduce the operator's
implementation burden further; the launch of Algeria's e-invoicing
mandate (expected 2027) for which the invoice schema is already
future-proofed; the deployment of the DEM.DZ national EHR API for which
the FHIR export adapter is a stub; and the maturation of PowerSync Open
Edition (FSL → Apache-2.0 in 2 years) which provides the v2 offline-sync
upgrade path. The operator who completes this roadmap is positioned to
absorb these changes as incremental upgrades, not rewrites.

The call to action is simple: start with Phase 0 today. Create the
GitHub account, the organization, the repository. Write AGENTS.md. The
rest follows — one atomic step at a time.

References

References are organized in three tiers: (1) the source blueprint and
its citations, (2) the verified 2026-07-06 tool versions and free-tier
limits, (3) the regulatory and architectural authorities. All URLs were
accessible on 2026-07-06.

Source Document

1.  Clinic Management SaaS Technical Blueprint v2.0 (source document,
    provided by the operator) — internal — docs/blueprint-v2.0.md in the
    repository

Verified 2026-07-06 Tool Versions and Free Tiers

2.  Node.js Release Schedule (LTS lines, EOL dates) —
    https://github.com/nodejs/Release/blob/main/schedule.json

3.  Node.js Previous Releases (active LTS) —
    https://nodejs.org/en/about/previous-releases

4.  pnpm Installation and Corepack — https://pnpm.io/installation

5.  Next.js 16 release — https://nextjs.org/blog/next-16

6.  Next.js PWA guide —
    https://nextjs.org/docs/app/guides/progressive-web-apps

7.  Serwist docs — https://serwist.pages.dev/docs/next/getting-started

8.  Tailwind CSS v4 release —
    https://tailwindcss.com/blog/tailwindcss-v4

9.  shadcn/ui RTL changelog (Jan 2026) —
    https://ui.shadcn.com/docs/changelog/2026-01-rtl

10. shadcn/ui Base UI default (Jul 2026) —
    https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default

11. next-intl docs — https://next-intl.dev/docs/usage/translations

12. Drizzle ORM RLS docs — https://orm.drizzle.team/docs/rls

13. PostgreSQL 17 docs — https://www.postgresql.org/docs/17/

14. PostgreSQL Row-Level Security docs —
    https://www.postgresql.org/docs/current/ddl-rowsecurity.html

15. pgBackRest User Guide — https://pgbackrest.org/user-guide.html

16. NestJS docs — https://docs.nestjs.com/

17. Better Auth Organization plugin —
    https://better-auth.com/docs/plugins/organization

18. tRPC docs — https://trpc.io/docs

19. Socket.IO Redis adapter — https://socket.io/docs/v4/redis-adapter

20. Dexie.js docs — https://dexie.org

21. PowerSync pricing & Open Edition — https://powersync.com/pricing

22. Functional Source License (FSL) spec — https://fsl.software

23. Orthanc official site — https://www.orthanc-server.com

24. Vitest v4.1.10 release —
    https://github.com/vitest-dev/vitest/releases/tag/v4.1.10

25. Playwright v1.61.1 release —
    https://github.com/microsoft/playwright/releases/tag/v1.61.1

26. ESLint flat config (v10) —
    https://eslint.org/docs/latest/use/configure/configuration-files

27. GitHub Actions runner images (ubuntu-latest) —
    https://github.com/actions/runner-images/blob/main/README.md

28. actions/checkout releases —
    https://github.com/actions/checkout/releases

29. Vercel CLI docs — https://vercel.com/docs/cli

30. Vercel Hobby plan limits — https://vercel.com/docs/limits/usage

31. Neon pricing (Free tier) — https://neon.tech/pricing

32. Supabase pricing (Free tier) — https://supabase.com/pricing

33. Cloudflare Workers/Pages limits —
    https://developers.cloudflare.com/workers/platform/limits/

34. Sentry pricing (Developer plan) — https://sentry.io/pricing/

35. PostHog pricing (Cloud Free) — https://posthog.com/pricing

36. Better Stack pricing (Free tier) — https://betterstack.com/pricing

37. Grafana Cloud pricing (Free tier) — https://grafana.com/pricing/

38. Resend pricing (Free tier) — https://resend.com/pricing

39. Upstash Redis pricing (Free tier) — https://upstash.com/pricing

40. Inngest pricing (Free tier) — https://www.inngest.com/pricing

41. Doppler pricing (Personal Free) — https://www.doppler.com/pricing

42. Chargily Pay v2 pricing — https://chargily.com/business/pay/pricing

43. BulkGate SMS pricing Algeria —
    https://www.bulkgate.com/en/pricing/sms/dz/algeria

44. GitHub Free features —
    https://docs.github.com/en/get-started/learning-about-github/githubs-products

45. GitHub Repository Rulesets —
    https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets

46. GitHub CODEOWNERS syntax —
    https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners

47. Renovate configuration options —
    https://docs.renovatebot.com/configuration-options/

48. Lighthouse CI — https://github.com/GoogleChrome/lighthouse-ci

49. OWASP CSP Cheat Sheet —
    https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html

50. k6 v2.1.0 release —
    https://github.com/grafana/k6/releases/tag/v2.1.0

51. AWS SaaS Factory multi-tenant architectures —
    https://docs.aws.amazon.com/solutions/multi-tenant-architectures-on-aws

52. Martin Fowler — Monolith First —
    https://martinfowler.com/bliki/MonolithFirst.html

53. Shopify Engineering — Deconstructing the Monolith —
    https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity

54. NIST RBAC — https://csrc.nist.gov/projects/role-based-access-control

55. NIST SP 800-92 (Log Management) —
    https://csrc.nist.gov/pubs/sp/800/92/final

56. NIST SP 800-34 Rev 1 (Contingency Planning) —
    https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final

57. OWASP Logging Cheat Sheet —
    https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html

58. ISO 3950:2016 — Dentistry: Designation system for teeth —
    https://www.iso.org/standard/41835.html

59. ADA — CDT Code — https://www.ada.org/publications/cdt

60. OpenMRS information model —
    https://guide.openmrs.org/getting-started/openmrs-information-model

61. OpenDental database schema —
    https://www.opendental.com/site/databaseschema.html

62. OpenEMR Access Controls —
    https://www.open-emr.org/wiki/index.php/Access_Controls_Listing

63. HL7 FHIR R5 — https://hl7.org/fhir/

Algerian Regulatory & Legal (★★★ Official)

64. Law 18-07 of 10 June 2018 on data protection — Journal Officiel N°
    34 — https://www.joradp.dz/FTP/jo-francais/2018/F2018034.pdf

65. Law 18-07 official PDF via ANPDP —
    https://anpdp.dz/wp-content/uploads/2023/01/2.1-Loi-N°18-07-2.pdf

66. Law 18-11 of 2 July 2018 on health — Journal Officiel N° 46 —
    https://www.joradp.dz/FTP/jo-francais/2018/F2018046.pdf

67. Algerian Civil Code, Ordinance 75-58 of 26 September 1975 (WIPO
    WIPOlex) — https://www.wipo.int/wipolex/en/legislation/details/14774

68. Algerian Code des Taxes sur le Chiffre d'Affaires (Direction
    Générale des Douanes) —
    https://www.douane.gov.dz/IMG/pdf/code_des_taxes_sur_le_chiffre_d_affaire.pdf

69. ANPDP (Autorité Nationale de Protection des Données à caractère
    Personnel) — https://anpdp.dz

70. Ministry of Health (Ministère de la Santé) — https://sante.gov.dz

71. MTESS (Ministry of Labour, Employment and Social Security) —
    https://www.mtess.gov.dz

72. CNAS portal — Carte CHIFA —
    https://cnas.dz/fr/carte-chifa-et-le-system-du-tiers-payant

73. CASNOS portal — https://www.casnos.dz

74. ARPCE (Autorité de Régulation de la Poste et des Communications
    Électroniques) — https://www.arpce.dz

75. MFDGI TVA page —
    https://www.mfdgi.gov.dz/fr/professionnels/services-pro/regime-reel/la-taxe-sur-la-valeur-ajoutee

76. CERIST Cloud — https://cloud.cerist.dz/Cloud-CERIST-En.html

77. Djezzy Cloud — https://djezzycloud.dz

78. Algérie Télécom (Djawab) — https://www.algerietelecom.dz

Reputable Secondary Sources (★★☆)

79. DLA Piper Data Protection Laws of the World — Algeria —
    https://www.dlapiperdataprotection.com/?c=DZ

80. CMS Expert Guide — Algeria data protection —
    https://cms.law/en/int/expert-guides/cms-expert-guide-to-data-protection-and-cyber-security-laws/algeria2

81. Gide (Paris/Algiers) — Protection of personal data focus on Algerian
    regulations —
    https://www.gide.com/en/news-insights/protection-of-personal-data-focus-on-algerian-regulations

82. LEX Africa — Algerian data protection law becomes effective —
    https://lexafrica.com/2023/08/the-algerian-data-protection-law-becomes-effective

83. Crunchy Data — Designing your Postgres database for multi-tenancy —
    https://www.crunchydata.com/blog/designing-your-postgres-database-for-multi-tenancy

84. Crunchy Data — Row-level security for tenants in Postgres —
    https://www.crunchydata.com/blog/row-level-security-for-tenants-in-postgres

85. Ink & Switch — Local-first software —
    https://www.inkandswitch.com/essay/local-first

86. MakerKit — Better Auth vs Clerk —
    https://makerkit.dev/blog/tutorials/better-auth-vs-clerk

87. MakerKit — Drizzle vs Prisma —
    https://makerkit.dev/blog/tutorials/drizzle-vs-prisma

88. Fire.ly — State of FHIR in 2025 —
    https://fire.ly/blog/the-state-of-fhir-in-2025

89. vatcalc.com — Algeria e-invoicing —
    https://vatcalc.com/algeria/e-invoicing-algeria/

90. vatupdate.com — Algeria e-invoicing timeline —
    https://vatupdate.com/algeria-e-invoicing/

91. WonderNetwork — Algiers↔Paris latency —
    https://wondernetwork.com/pings/Paris

92. Twilio SMS guidelines — Algeria —
    https://www.twilio.com/en-us/guidelines/dz/sms
