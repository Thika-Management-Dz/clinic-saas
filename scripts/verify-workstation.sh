#!/usr/bin/env bash
# scripts/verify-workstation.sh
#
# Lightweight verification that a sandbox is ready for clinic-saas work.
# Intended to be run at the START of every AI-agent session, BEFORE picking
# up an issue. Exits non-zero if any required tool is missing or at the
# wrong version, so the agent (or its orchestrator) can re-run
# setup-workstation.sh before wasting time on a half-broken sandbox.
#
# This script does NOT install anything — it only checks. Use
# setup-workstation.sh for installation.
#
# Usage:
#   ./scripts/verify-workstation.sh
#
# Exit codes:
#   0  all required tools present and at the expected versions
#   1  one or more required tools missing or mismatched

set -euo pipefail

NODE_VERSION="24.18.0"
PNPM_VERSION="11.10.0"
GIT_MIN_VERSION="2.45"
VERCEL_VERSION="54.20.1"
SENTRY_CLI_VERSION="2.45.0"

if [ -t 1 ]; then
  GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; RED=$'\033[0;31m'; RESET=$'\033[0m'
else
  GREEN=""; YELLOW=""; RED=""; RESET=""
fi

failures=0

version_ge() {
  local a="$1" b="$2"
  local IFS=.
  # shellcheck disable=SC2206
  local a_parts=($a) b_parts=($b)
  local i
  for i in 0 1 2 3 4; do
    local av="${a_parts[i]:-0}" bv="${b_parts[i]:-0}"
    av="${av//[^0-9]/}" bv="${bv//[^0-9]/}"
    [ "$av" -ge "$bv" ] 2>/dev/null || return 1
  done
  return 0
}

# Required: must be present AND at the exact/pinned version
req_exact() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    printf '  %sOK%s   %-14s %s\n' "$GREEN" "$RESET" "$label" "$actual"
  else
    printf '  %sFAIL%s %-14s got %s, expected %s\n' "$RED" "$RESET" "$label" "$actual" "$expected"
    failures=$((failures + 1))
  fi
}

# Required: must be present AND >= min version
req_min() {
  local label="$1" min="$2" actual="$3"
  if [ -z "$actual" ] || [ "$actual" = "MISSING" ]; then
    printf '  %sFAIL%s %-14s MISSING (need >= %s)\n' "$RED" "$RESET" "$label" "$min"
    failures=$((failures + 1))
  elif version_ge "$actual" "$min"; then
    printf '  %sOK%s   %-14s %s (>= %s)\n' "$GREEN" "$RESET" "$label" "$actual" "$min"
  else
    printf '  %sFAIL%s %-14s %s (need >= %s)\n' "$RED" "$RESET" "$label" "$actual" "$min"
    failures=$((failures + 1))
  fi
}

# Optional: warn only
opt_min() {
  local label="$1" min="$2" actual="$3"
  if [ -z "$actual" ] || [ "$actual" = "MISSING" ]; then
    printf '  %sWARN%s %-14s MISSING (optional)\n' "$YELLOW" "$RESET" "$label"
  elif version_ge "$actual" "$min"; then
    printf '  %sOK%s   %-14s %s\n' "$GREEN" "$RESET" "$label" "$actual"
  else
    printf '  %sWARN%s %-14s %s (older than %s)\n' "$YELLOW" "$RESET" "$label" "$actual" "$min"
  fi
}

echo "=== clinic-saas workstation verification ==="

# Load nvm if available (so node/pnpm are on PATH in fresh shells)
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1 || true

req_exact "node"       "$NODE_VERSION"      "$(node --version 2>/dev/null || echo MISSING)"
req_exact "pnpm"       "$PNPM_VERSION"      "$(pnpm --version 2>/dev/null || echo MISSING)"
req_min   "git"        "$GIT_MIN_VERSION"   "$(git --version 2>/dev/null | awk '{print $3}' || echo MISSING)"
req_exact "vercel"     "$VERCEL_VERSION"    "$(vercel --version 2>/dev/null || echo MISSING)"
req_exact "sentry-cli" "$SENTRY_CLI_VERSION" "$(sentry-cli --version 2>/dev/null | awk '{print $2}' || echo MISSING)"

opt_min "docker"   "27"    "$(docker --version 2>/dev/null | awk '{print $3}' | tr -d ',' || echo MISSING)"
opt_min "gh"       "2.65"  "$(gh --version 2>/dev/null | head -1 | awk '{print $3}' || echo MISSING)"
opt_min "wrangler" "3.0"   "$(wrangler --version 2>/dev/null | awk '{print $NF}' || echo MISSING)"
opt_min "doppler"  "0.5.10" "$(doppler --version 2>/dev/null | awk '{print $3}' || echo MISSING)"

echo ""
echo "=== workspace readiness ==="
if [ -f pnpm-workspace.yaml ]; then
  if [ -d node_modules ]; then
    printf '  %sOK%s   pnpm-workspace.yaml present, node_modules populated\n' "$GREEN" "$RESET"
  else
    printf '  %sWARN%s pnpm-workspace.yaml present but node_modules missing — run: pnpm install\n' "$YELLOW" "$RESET"
    failures=$((failures + 1))
  fi
else
  printf '  %sWARN%s pnpm-workspace.yaml not found — Phase 3 monorepo scaffold not yet merged\n' "$YELLOW" "$RESET"
fi

if [ -f .env.local ]; then
  printf '  %sOK%s   .env.local present\n' "$GREEN" "$RESET"
else
  printf '  %sWARN%s .env.local missing — run: cp .env.example .env.local && $EDITOR .env.local\n' "$YELLOW" "$RESET"
fi

echo ""
if [ "$failures" -gt 0 ]; then
  printf '%sFAIL: %d check(s) failed. Run ./scripts/setup-workstation.sh to fix.%s\n' "$RED" "$failures" "$RESET"
  exit 1
fi
printf '%sAll required tools verified. Ready to work.%s\n' "$GREEN" "$RESET"
exit 0
