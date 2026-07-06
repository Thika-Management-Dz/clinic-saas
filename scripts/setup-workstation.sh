#!/usr/bin/env bash
# scripts/setup-workstation.sh
#
# Idempotent workstation setup for the Clinic Management SaaS project.
# Implements the toolchain portion of Roadmap v2.1 Phase 1 (Developer
# Workstation & Tooling) for a HEADLESS AI-AGENT SANDBOX.
#
# Headless-profile adaptations:
#   - Installs only CLI tools. No GUI applications or editor extensions
#     are installed — every tool the agent needs (eslint, prettier,
#     playwright, gh, drizzle-kit) is invoked from the command line via
#     pnpm scripts or npx.
#   - Replaces the browser-based CLI login flows (vercel login,
#     doppler login, wrangler login) with token-based env-var auth,
#     since browser flows are impossible in a headless sandbox. The
#     operator must provide the tokens via .env.local (see .env.example).
#
# Idempotent: safe to re-run. Each section checks whether the tool is
# already installed at the expected version and skips if so.
#
# Usage:
#   git clone https://github.com/Thika-Management-Dz/clinic-saas
#   cd clinic-saas
#   ./scripts/setup-workstation.sh
#   cp .env.example .env.local && $EDITOR .env.local   # fill in secrets
#   pnpm install
#
# Exit codes:
#   0  success (or already set up)
#   1  fatal error (missing OS package manager, version mismatch, etc.)

set -euo pipefail

# --- Configuration (pinned per Roadmap v2.1 Phase 1) -----------------------
NODE_VERSION="24.18.0"
PNPM_VERSION="11.10.0"
NVM_VERSION="0.40.1"
GIT_MIN_VERSION="2.45"
DOCKER_MIN_VERSION="27"
VERCEL_VERSION="54.20.1"
SENTRY_CLI_VERSION="2.45.0"
DOPPLER_MIN_VERSION="0.5.10"

# Color output (disabled if not a TTY)
if [ -t 1 ]; then
  GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; RED=$'\033[0;31m'; RESET=$'\033[0m'
else
  GREEN=""; YELLOW=""; RED=""; RESET=""
fi

log()  { printf '%s[setup]%s %s\n' "$GREEN" "$RESET" "$*"; }
warn() { printf '%s[warn]%s %s\n' "$YELLOW" "$RESET" "$*" >&2; }
die()  { printf '%s[fatal]%s %s\n' "$RED" "$RESET" "$*" >&2; exit 1; }

# Version comparison: returns 0 if $1 >= $2 (semver-ish, numeric only)
version_ge() {
  local a="$1" b="$2"
  local IFS=.
  # shellcheck disable=SC2206
  local a_parts=($a) b_parts=($b)
  local i
  for i in 0 1 2 3 4; do
    local av="${a_parts[i]:-0}" bv="${b_parts[i]:-0}"
    # strip non-numeric suffixes (e.g. "27.3.1" from "Docker version 27.3.1")
    av="${av//[^0-9]/}" bv="${bv//[^0-9]/}"
    [ "$av" -ge "$bv" ] 2>/dev/null || return 1
  done
  return 0
}

# --- 1.1 Node.js (via nvm) --------------------------------------------------
setup_node() {
  log "Node.js $NODE_VERSION (via nvm)"

  # Ensure nvm is loaded for this shell
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    log "Installing nvm $NVM_VERSION..."
    curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/v${NVM_VERSION}/install.sh" | bash
    # shellcheck disable=SC1091
    . "$NVM_DIR/nvm.sh"
  else
    # shellcheck disable=SC1091
    . "$NVM_DIR/nvm.sh"
  fi

  # Detect .npmrc prefix/globalconfig conflict (nvm use exits 11 if either is
  # set). nvm requires per-Node-version control over npm's global install
  # location; an .npmrc `prefix=` or `globalconfig=` line overrides that and
  # breaks nvm isolation. When detected, we remove the offending line(s) from
  # ~/.npmrc (preserving other lines) BEFORE calling nvm install/use. This is
  # destructive to the prefix setting but necessary for nvm to work; the
  # operator is warned and told how to restore the prefix afterwards if needed.
  # Common trigger: AI-agent sandboxes that share a global npm install dir
  # across Node versions for non-clinic-saas tools (mermaid-cli, docx, etc.).
  if [ -f "$HOME/.npmrc" ] && grep -qE '^(prefix|globalconfig)[[:space:]]*=' "$HOME/.npmrc"; then
    warn "  ~/.npmrc contains a 'prefix=' or 'globalconfig=' setting."
    warn "  This is incompatible with nvm's per-Node-version isolation."
    warn "  Removing the offending line(s) from ~/.npmrc (other lines are preserved)."
    warn "  If you need the prefix for non-clinic-saas tools, restore it after this script"
    warn "  finishes (e.g. by re-adding 'prefix=...' to ~/.npmrc)."
    sed -i '/^\(prefix\|globalconfig\)[[:space:]]*=/d' "$HOME/.npmrc"
  fi

  if ! nvm ls "$NODE_VERSION" >/dev/null 2>&1; then
    log "Installing Node $NODE_VERSION..."
    nvm install "$NODE_VERSION"
  fi
  nvm alias default "$NODE_VERSION"
  nvm use "$NODE_VERSION" >/dev/null

  local actual_node actual_npm
  actual_node="$(node --version)"   # e.g. v24.18.0
  actual_npm="$(npm --version)"     # e.g. 11.17.0
  [ "$actual_node" = "v$NODE_VERSION" ] || die "Node version mismatch: expected v$NODE_VERSION, got $actual_node"
  log "  node=$actual_node npm=$actual_npm"
}

# --- 1.2 pnpm (via Corepack) -----------------------------------------------
setup_pnpm() {
  log "pnpm $PNPM_VERSION (via Corepack)"
  corepack enable
  corepack prepare "pnpm@${PNPM_VERSION}" --activate
  local actual_pnpm
  actual_pnpm="$(pnpm --version)"
  [ "$actual_pnpm" = "$PNPM_VERSION" ] || die "pnpm version mismatch: expected $PNPM_VERSION, got $actual_pnpm"
  log "  pnpm=$actual_pnpm"
}

# --- 1.3 Git (verify only; install is OS-level) ---------------------------
setup_git() {
  log "Git >= $GIT_MIN_VERSION"
  command -v git >/dev/null || die "git not found. Install via your OS package manager (apt/brew/winget)."
  local git_ver
  git_ver="$(git --version | awk '{print $3}')"   # e.g. 2.45.1
  version_ge "$git_ver" "$GIT_MIN_VERSION" || die "git too old: need >= $GIT_MIN_VERSION, got $git_ver"

  # Sensible defaults (do NOT set user.name/user.email — those are per-operator)
  git config --global init.defaultBranch main 2>/dev/null || true
  git config --global color.ui auto 2>/dev/null || true
  git config --global pull.rebase true 2>/dev/null || true
  log "  git=$git_ver (defaults applied)"
}

# --- 1.4 Docker (verify only; install is OS-level) ------------------------
setup_docker() {
  log "Docker >= $DOCKER_MIN_VERSION"
  if ! command -v docker >/dev/null; then
    warn "docker not found. Install Docker Desktop or docker engine before proceeding."
    warn "  Some agent tasks (DB migrations against a local Postgres container,"
    warn "  parity tests) will be unavailable until Docker is installed."
    return 0
  fi
  local docker_ver
  docker_ver="$(docker --version | awk '{print $3}' | tr -d ',')"   # e.g. 27.3.1
  version_ge "$docker_ver" "$DOCKER_MIN_VERSION" || warn "docker older than $DOCKER_MIN_VERSION (got $docker_ver) — may break parity tests"
  if ! docker info >/dev/null 2>&1; then
    warn "docker daemon not running. Start Docker Desktop or 'sudo systemctl start docker'."
  fi
  log "  docker=$docker_ver"
}

# --- 1.6 Infrastructure CLIs (npm -g, pinned) -----------------------------
setup_infra_clis() {
  log "Infrastructure CLIs"

  # gh CLI — verify only (install is OS-level)
  if command -v gh >/dev/null; then
    log "  gh=$(gh --version | head -1 | awk '{print $3}')"
  else
    warn "gh CLI not found. Install via apt/brew/winget. GitHub operations will be unavailable."
  fi

  # Vercel CLI (pinned) — used for deploys and `vercel env` management
  if ! command -v vercel >/dev/null || [ "$(vercel --version 2>/dev/null)" != "$VERCEL_VERSION" ]; then
    log "  installing vercel@$VERCEL_VERSION..."
    npm install -g "vercel@${VERCEL_VERSION}"
  fi
  log "  vercel=$(vercel --version)"

  # Sentry CLI (pinned) — used for source map upload and release tracking
  if ! command -v sentry-cli >/dev/null || [ "$(sentry-cli --version 2>/dev/null | awk '{print $2}')" != "$SENTRY_CLI_VERSION" ]; then
    log "  installing @sentry/cli@$SENTRY_CLI_VERSION..."
    npm install -g "@sentry/cli@${SENTRY_CLI_VERSION}"
  fi
  log "  sentry-cli=$(sentry-cli --version | awk '{print $2}')"

  # Wrangler (Cloudflare) — latest, since wrangler ships frequent patches
  if ! command -v wrangler >/dev/null; then
    log "  installing wrangler@latest..."
    npm install -g wrangler@latest
  fi
  log "  wrangler=$(wrangler --version | awk '{print $NF}')"

  # Doppler CLI — verify only (install is OS-level; pip/brew/curl installers)
  if command -v doppler >/dev/null; then
    local doppler_ver
    doppler_ver="$(doppler --version | awk '{print $3}')"   # e.g. 0.5.10
    version_ge "$doppler_ver" "$DOPPLER_MIN_VERSION" || warn "doppler older than $DOPPLER_MIN_VERSION (got $doppler_ver)"
    log "  doppler=$doppler_ver"
  else
    warn "doppler CLI not found. Install via 'curl -Ls https://git.io/install-doppler | sh' (Linux) or 'brew install dopplerhq/doppler/doppler' (macOS). Secrets sync will be unavailable."
  fi
}

# --- 1.7 Auth (token-based, headless) -------------------------------------
setup_auth() {
  log "CLI auth (token-based, headless-friendly)"
  # We do NOT call vercel login / doppler login / wrangler login here,
  # because they open a browser. The operator must instead provide tokens
  # via .env.local (copied from .env.example). See .env.example for the
  # full list and where each token comes from.
  #
  # At runtime, pnpm scripts read these env vars; the CLIs pick them up
  # automatically:
  #   VERCEL_TOKEN            -> vercel --token
  #   DOPPLER_TOKEN           -> doppler configure set token
  #   CLOUDFLARE_API_TOKEN    -> wrangler (reads natively)
  #   SENTRY_AUTH_TOKEN       -> sentry-cli (reads natively)
  #   GH_TOKEN                -> gh (reads natively)
  if [ -f .env.local ]; then
    log "  .env.local present — loading for auth verification..."
    # shellcheck disable=SC1091
    set -a; . .env.local; set +a
    [ -n "${VERCEL_TOKEN:-}" ]         && log "    VERCEL_TOKEN: set"         || warn "    VERCEL_TOKEN: not set"
    [ -n "${DOPPLER_TOKEN:-}" ]        && log "    DOPPLER_TOKEN: set"        || warn "    DOPPLER_TOKEN: not set"
    [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && log "    CLOUDFLARE_API_TOKEN: set" || warn "    CLOUDFLARE_API_TOKEN: not set"
    [ -n "${SENTRY_AUTH_TOKEN:-}" ]    && log "    SENTRY_AUTH_TOKEN: set"    || warn "    SENTRY_AUTH_TOKEN: not set"
    [ -n "${GH_TOKEN:-}" ]             && log "    GH_TOKEN: set"             || warn "    GH_TOKEN: not set"
  else
    warn "  .env.local not found. After this script finishes, run:"
    warn "    cp .env.example .env.local && \$EDITOR .env.local"
    warn "  then re-run this script (or source .env.local) to verify auth."
  fi
}

# --- Phase 3 readiness (only if pnpm-workspace.yaml exists) ---------------
setup_workspace_deps() {
  if [ -f pnpm-workspace.yaml ]; then
    log "pnpm-workspace.yaml detected — running pnpm install..."
    pnpm install
  else
    log "pnpm-workspace.yaml not found — Phase 3 monorepo scaffold not yet merged."
    log "  Skipping 'pnpm install'. Re-run this script after Phase 3 lands."
  fi
}

# --- Final verification -----------------------------------------------------
verify() {
  log "Verification (Roadmap Phase 1 verification block, headless subset)"
  local failures=0
  check() {
    local label="$1" expected="$2" actual="$3"
    if [ "$actual" = "$expected" ] || [ "${expected:0:1}" = ">" ] && version_ge "$actual" "${expected#>}"; then
      printf '  %-14s %s\n' "$label" "$actual"
    else
      printf '  %-14s %s (expected %s)\n' "$label" "$actual" "$expected"
      failures=$((failures + 1))
    fi
  }

  check "node"     "v$NODE_VERSION"        "$(node --version)"
  check "pnpm"     "$PNPM_VERSION"         "$(pnpm --version)"
  check "git"      ">$GIT_MIN_VERSION"     "$(git --version | awk '{print $3}')"
  check "vercel"   "$VERCEL_VERSION"       "$(vercel --version 2>/dev/null || echo MISSING)"
  check "sentry"   "$SENTRY_CLI_VERSION"   "$(sentry-cli --version 2>/dev/null | awk '{print $2}' || echo MISSING)"

  # Optional tools (warn, don't fail)
  command -v docker  >/dev/null && printf '  %-14s %s\n' "docker"  "$(docker --version | awk '{print $3}' | tr -d ',')"  || printf '  %-14s %s\n' "docker"  "MISSING (optional)"
  command -v gh      >/dev/null && printf '  %-14s %s\n' "gh"      "$(gh --version | head -1 | awk '{print $3}')"        || printf '  %-14s %s\n' "gh"      "MISSING (optional)"
  command -v wrangler >/dev/null && printf '  %-14s %s\n' "wrangler" "$(wrangler --version | awk '{print $NF}')"         || printf '  %-14s %s\n' "wrangler" "MISSING (optional)"
  command -v doppler >/dev/null && printf '  %-14s %s\n' "doppler" "$(doppler --version | awk '{print $3}')"            || printf '  %-14s %s\n' "doppler" "MISSING (optional)"

  if [ "$failures" -gt 0 ]; then
    die "Verification failed with $failures mismatch(es). Fix above before proceeding."
  fi
  log "All pinned tools verified."
}

# --- Main ------------------------------------------------------------------
main() {
  log "Clinic SaaS workstation setup starting (headless AI-agent profile)"
  setup_node
  setup_pnpm
  setup_git
  setup_docker
  setup_infra_clis
  setup_auth
  setup_workspace_deps
  verify
  log "Done. Next: cp .env.example .env.local && \$EDITOR .env.local (if not done), then pnpm dev"
}

main "$@"
