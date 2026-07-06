# Runbook: Workstation Setup (AI-Agent Sandbox)

> **Purpose:** step-by-step procedure for preparing a fresh AI-agent sandbox
> to work on the Clinic Management SaaS project. Encodes Roadmap v2.1 Phase 1
> (Developer Workstation & Tooling) as two idempotent scripts so that every
> new sandbox reaches a known-good state in under five minutes.
>
> **Audience:** the operator (solo vibe-coder) and any AI agent session that
> needs to pick up work on the repo. This is the AI-agent equivalent of
> "clone the repo and run `make install`" — it exists because every fresh
> sandbox starts empty and Phase 1's toolchain must be re-established each
> time.

## When to run

- **Fresh sandbox, first time:** run `setup-workstation.sh` once after
  cloning the repo. Then copy `.env.example` to `.env.local` and fill in the
  tokens. Then run `verify-workstation.sh` to confirm everything is ready.
- **Every subsequent session in the same sandbox:** run
  `verify-workstation.sh` at session start. It is fast (~1 second) and
  catches drift (e.g. a sandbox that was reset overnight, or a tool that was
  accidentally removed). If it fails, re-run `setup-workstation.sh`.
- **After a Phase 3+ merge:** if `pnpm-workspace.yaml` appears (Phase 3),
  re-run `setup-workstation.sh` — it will detect the workspace and run
  `pnpm install` automatically.

## What you need

- A Linux or macOS sandbox with `bash`, `curl`, and `git` pre-installed.
- The repo cloned: `git clone https://github.com/Thika-Management-Dz/clinic-saas`
- Tokens for the CLIs you will use (see `.env.example` for the full list).
  At minimum, a GitHub PAT (`GH_TOKEN`) is required for any session that
  opens or merges PRs.

## Headless profile

This project is **AI-agent-only** — no human writes code, so no desktop
editor is needed. The workstation setup therefore installs only CLI tools:

- Node.js 24.18.0 (via nvm)
- pnpm 11.10.0 (via Corepack)
- Git (verified, not installed — assumed present)
- Docker (verified, not installed — warned if missing)
- Vercel CLI 54.20.1, Sentry CLI 2.45.0, Wrangler (latest), Doppler, gh
  (verified/installed as appropriate)

What is deliberately **not** installed:
- Any GUI application or desktop editor. The six editor extensions from the
  original Roadmap §1.5 (eslint, prettier, tailwind, prisma, playwright,
  github-pr) are all editor UIs for tools that already run fine from the CLI
  via `pnpm lint`, `pnpm exec prettier`, `pnpm exec playwright test`, `gh`,
  etc. Installing them in a headless sandbox wastes ~100 MB and gains
  nothing.
- Browser-based CLI auths (`vercel login`, `doppler login`, `wrangler login`).
  These open a browser, which is impossible in a headless sandbox. Instead,
  the CLIs read their tokens from environment variables (see `.env.example`
  and the "Authenticate All CLIs" section of Roadmap §1.6).

## Steps

### 1. Clone the repo (if not already cloned)

```bash
git clone https://github.com/Thika-Management-Dz/clinic-saas
cd clinic-saas
```

### 2. Run the setup script

```bash
./scripts/setup-workstation.sh
```

The script is idempotent — safe to re-run. It will:
- Install nvm 0.40.1 if missing, then Node 24.18.0.
- Enable Corepack and activate pnpm 11.10.0.
- Set git defaults (`init.defaultBranch=main`, `pull.rebase=true`).
- Verify Docker is installed and running (warns if not, does not fail).
- Install Vercel, Sentry, Wrangler CLIs globally (pinned versions where
  possible).
- Verify gh and Doppler CLIs (warns if missing — install is OS-level).
- Load `.env.local` if present and report which tokens are set.
- Run `pnpm install` if `pnpm-workspace.yaml` is present (Phase 3+).
- Print a verification block at the end.

### 3. Create your local env file

```bash
cp .env.example .env.local
$EDITOR .env.local   # fill in real token values
```

`.env.local` is gitignored (see `.gitignore`: `.env`, `.env.local`,
`.env.*.local`) — it will never be committed. Only `.env.example` (the
template) is committed.

At minimum, fill in `GH_TOKEN` (a GitHub PAT with `repo`, `workflow`, and
`admin:org` scopes). Other tokens (`VERCEL_TOKEN`, `DOPPLER_TOKEN`,
`CLOUDFLARE_API_TOKEN`, `SENTRY_AUTH_TOKEN`) are only needed for sessions
that touch those services.

### 4. Verify

```bash
./scripts/verify-workstation.sh
```

This is a lightweight checker that:
- Confirms Node, pnpm, Git, Vercel, Sentry CLI are at the expected versions
  (fails the check on mismatch).
- Warns (does not fail) if Docker, gh, Wrangler, or Doppler are missing or
  old.
- Checks that `pnpm-workspace.yaml` is present and `node_modules` is
  populated (warns if Phase 3 has not landed yet — expected for now).
- Checks that `.env.local` exists (warns if missing).

Exit code 0 means the sandbox is ready. Non-zero means run
`setup-workstation.sh` and/or fill in `.env.local`.

### 5. Start work

```bash
# Once Phase 3 lands:
pnpm install
pnpm dev   # starts web (:3000), api (:3001), worker

# For any session:
./scripts/verify-workstation.sh   # sanity check
# then pick up the task per AGENTS.md "AI Agent Workflow" section
```

## Token rotation

The `.env.example` file carries a reminder next to `GH_TOKEN`:
"ROTATE after every chat session where this token is shared." This is
critical because AI-agent sessions often receive the operator's PAT inline
in the chat prompt. Once the session ends, that token is in the chat
history and must be considered compromised.

Rotate at: https://github.com/settings/tokens

For the other tokens (Vercel, Doppler, Cloudflare, Sentry), rotate per
each provider's dashboard if you suspect they have been exposed.

## Troubleshooting

### `nvm: command not found` after setup

The setup script sources `$NVM_DIR/nvm.sh`, but that only applies to the
current shell. For new shells, ensure your `~/.bashrc` (or `~/.zshrc`)
contains:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

The nvm installer adds this automatically; if you skipped that step, add
it manually.

### `corepack: command not found`

Corepack ships with Node 16+. If it is missing, your Node installation is
incomplete. Reinstall Node 24.18.0 via nvm:

```bash
nvm uninstall 24.18.0
nvm install 24.18.0
nvm alias default 24.18.0
```

### Docker daemon not running

On Linux: `sudo systemctl start docker`. On macOS/Windows: launch Docker
Desktop. The setup script warns but does not fail; some agent tasks (DB
migrations against a local Postgres container, parity tests) will be
unavailable until Docker is running.

### `pnpm install` fails with workspace errors

This only happens after Phase 3 lands. If you see workspace errors before
Phase 3, it means `pnpm-workspace.yaml` exists but `package.json` references
packages that don't exist yet. Re-run `setup-workstation.sh` after pulling
the latest main.

## Cross-references

- [Roadmap v2.1 §1](../roadmap-v2.1.md) — Phase 1 (Developer Workstation &
  Tooling): the authoritative source for pinned versions.
- [AGENTS.md](../../AGENTS.md) — build commands, code style, AI agent
  workflow.
- [AI Agent PR Review Session](./ai-agent-pr-review.md) — the review
  procedure every PR must pass before merge (ADR-010).
- [.env.example](../../.env.example) — the full env var template, organized
  by Roadmap phase.
- [Breach Response](./breach-response.md) — what to do if a token is
  accidentally committed or exposed.
