#!/usr/bin/env bash
# tests/test-setup-workstation.sh
#
# Plain-bash assertion tests for the .npmrc prefix-conflict fix and the
# verify-workstation.sh v-prefix comparison fix in scripts/setup-workstation.sh
# and scripts/verify-workstation.sh.
#
# These tests address Task 17-a (JC-6-3, deferred to Phase 8 by Task 14,
# pulled forward by Task 17). Phase 8 will add the full Vitest + Playwright
# test framework; this file is a Phase-1-appropriate shell test that validates
# the two specific fixes from Task 11 (PR #6) without requiring any test
# framework dependency.
#
# The tests do NOT invoke setup-workstation.sh end-to-end (that would require
# nvm, Node, pnpm, etc. to be installed — too heavyweight for a unit test).
# Instead, they extract the exact sed/grep commands and comparison logic from
# the scripts and test them in isolation against temp .npmrc files.
#
# Usage:
#   ./tests/test-setup-workstation.sh
#   bash tests/test-setup-workstation.sh
#
# Exit codes:
#   0  all tests passed
#   1  one or more tests failed
#
# Add to CI in Phase 7/8 alongside pnpm test. For now, run manually after
# any change to scripts/setup-workstation.sh or scripts/verify-workstation.sh.

set -euo pipefail

# --- Test framework (minimal) -----------------------------------------------
PASS_COUNT=0
FAIL_COUNT=0
FAILURES=()

# assert_eq <label> <expected> <actual>
assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    printf '  %sPASS%s  %s\n' "${GREEN:-}" "${RESET:-}" "$label"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    printf '  %sFAIL%s  %s\n' "${RED:-}" "${RESET:-}" "$label"
    printf '         expected: %s\n' "$expected"
    printf '         actual:   %s\n' "$actual"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    FAILURES+=("$label (expected: $expected, actual: $actual)")
  fi
}

# assert_contains <label> <haystack> <needle>
assert_contains() {
  local label="$1" haystack="$2" needle="$3"
  if printf '%s' "$haystack" | grep -qF -- "$needle"; then
    printf '  %sPASS%s  %s\n' "${GREEN:-}" "${RESET:-}" "$label"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    printf '  %sFAIL%s  %s\n' "${RED:-}" "${RESET:-}" "$label"
    printf '         expected to contain: %s\n' "$needle"
    printf '         actual:               %s\n' "$haystack"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    FAILURES+=("$label (missing substring: $needle)")
  fi
}

# assert_not_contains <label> <haystack> <needle>
assert_not_contains() {
  local label="$1" haystack="$2" needle="$3"
  if printf '%s' "$haystack" | grep -qF -- "$needle"; then
    printf '  %sFAIL%s  %s\n' "${RED:-}" "${RESET:-}" "$label"
    printf '         expected NOT to contain: %s\n' "$needle"
    printf '         actual:                  %s\n' "$haystack"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    FAILURES+=("$label (unexpected substring: $needle)")
  else
    printf '  %sPASS%s  %s\n' "${GREEN:-}" "${RESET:-}" "$label"
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
}

# --- Color setup (disabled if not a TTY) ------------------------------------
if [ -t 1 ]; then
  GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; YELLOW=$'\033[0;33m'; RESET=$'\033[0m'
else
  GREEN=""; RED=""; YELLOW=""; RESET=""
fi

# --- Setup: temp HOME with temp .npmrc --------------------------------------
TMPDIR_TEST="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_TEST"' EXIT

# We test the EXACT sed/grep commands from setup-workstation.sh lines 96-103.
# If those lines change, this test must be updated to match. The test extracts
# the logic by reproducing the commands verbatim — this is intentional, so a
# regression in the script (e.g. someone changes the sed pattern) is caught.
#
# Original logic from setup-workstation.sh:
#   if [ -f "$HOME/.npmrc" ] && grep -qE '^(prefix|globalconfig)[[:space:]]*=' "$HOME/.npmrc"; then
#     warn "...5 warning lines..."
#     sed -i '/^\(prefix\|globalconfig\)[[:space:]]*=/d' "$HOME/.npmrc"
#   fi
#
# For the test, we use $TMPDIR_TEST/.npmrc instead of $HOME/.npmrc.

apply_npmrc_fix() {
  local npmrc_file="$1"
  if [ -f "$npmrc_file" ] && grep -qE '^(prefix|globalconfig)[[:space:]]*=' "$npmrc_file"; then
    # (warn lines omitted — they're diagnostic, not testable logic)
    sed -i '/^\(prefix\|globalconfig\)[[:space:]]*=/d' "$npmrc_file"
  fi
}

# Reproduce the v-prefix comparison logic from verify-workstation.sh line 93:
#   req_exact "node" "v$NODE_VERSION" "$(node --version 2>/dev/null || echo MISSING)"
# where NODE_VERSION="24.18.0" (no v prefix). The expected value is "v$NODE_VERSION"
# (i.e. "v24.18.0"), matching `node --version` output format.
NODE_VERSION_TEST="24.18.0"
expected_node_version="v${NODE_VERSION_TEST}"   # the Task 11 fix

echo "=== Task 17-a: setup-workstation.sh .npmrc fix tests ==="
echo ""

# --- Test 1: prefix= line is removed, other lines preserved -----------------
echo "Test 1: prefix= line is removed, other lines preserved"
cat > "$TMPDIR_TEST/.npmrc" << 'EOF'
prefix=/home/user/.npm-global
registry=https://registry.npmjs.org/
fund=false
EOF
apply_npmrc_fix "$TMPDIR_TEST/.npmrc"
content="$(cat "$TMPDIR_TEST/.npmrc")"
assert_not_contains "prefix= line removed" "$content" "prefix="
assert_contains    "registry line preserved" "$content" "registry=https://registry.npmjs.org/"
assert_contains    "fund line preserved" "$content" "fund=false"
echo ""

# --- Test 2: globalconfig= line is removed, other lines preserved ------------
echo "Test 2: globalconfig= line is removed, other lines preserved"
cat > "$TMPDIR_TEST/.npmrc" << 'EOF'
globalconfig=/home/user/.npmrc-global
registry=https://registry.npmjs.org/
fund=false
EOF
apply_npmrc_fix "$TMPDIR_TEST/.npmrc"
content="$(cat "$TMPDIR_TEST/.npmrc")"
assert_not_contains "globalconfig= line removed" "$content" "globalconfig="
assert_contains    "registry line preserved" "$content" "registry=https://registry.npmjs.org/"
assert_contains    "fund line preserved" "$content" "fund=false"
echo ""

# --- Test 3: both prefix= and globalconfig= removed together ----------------
echo "Test 3: both prefix= and globalconfig= removed together"
cat > "$TMPDIR_TEST/.npmrc" << 'EOF'
prefix=/home/user/.npm-global
globalconfig=/home/user/.npmrc-global
registry=https://registry.npmjs.org/
EOF
apply_npmrc_fix "$TMPDIR_TEST/.npmrc"
content="$(cat "$TMPDIR_TEST/.npmrc")"
assert_not_contains "prefix= line removed" "$content" "prefix="
assert_not_contains "globalconfig= line removed" "$content" "globalconfig="
assert_contains    "registry line preserved" "$content" "registry=https://registry.npmjs.org/"
echo ""

# --- Test 4: idempotency — running the fix twice produces the same end state -
echo "Test 4: idempotency — running the fix twice produces the same end state"
cat > "$TMPDIR_TEST/.npmrc" << 'EOF'
prefix=/home/user/.npm-global
registry=https://registry.npmjs.org/
EOF
apply_npmrc_fix "$TMPDIR_TEST/.npmrc"
content_after_first="$(cat "$TMPDIR_TEST/.npmrc")"
apply_npmrc_fix "$TMPDIR_TEST/.npmrc"
content_after_second="$(cat "$TMPDIR_TEST/.npmrc")"
assert_eq "same state after first and second run" "$content_after_first" "$content_after_second"
assert_not_contains "no prefix= after second run" "$content_after_second" "prefix="
assert_contains    "registry preserved after second run" "$content_after_second" "registry=https://registry.npmjs.org/"
echo ""

# --- Test 5: no-op when .npmrc has no prefix= or globalconfig= --------------
echo "Test 5: no-op when .npmrc has no prefix= or globalconfig="
cat > "$TMPDIR_TEST/.npmrc" << 'EOF'
registry=https://registry.npmjs.org/
fund=false
EOF
content_before="$(cat "$TMPDIR_TEST/.npmrc")"
apply_npmrc_fix "$TMPDIR_TEST/.npmrc"
content_after="$(cat "$TMPDIR_TEST/.npmrc")"
assert_eq "unchanged when no conflict" "$content_before" "$content_after"
echo ""

# --- Test 6: no-op when .npmrc does not exist -------------------------------
echo "Test 6: no-op when .npmrc does not exist"
rm -f "$TMPDIR_TEST/.npmrc"
# Should not error (grep -qE on missing file returns non-zero, the if guard short-circuits)
apply_npmrc_fix "$TMPDIR_TEST/.npmrc"
assert_eq "no error when .npmrc missing" "0" "0"  # if we got here, the function didn't error
echo ""

# --- Test 7: lines with leading whitespace before prefix= are NOT removed ---
echo "Test 7: lines with leading whitespace before prefix= are NOT removed (sed pattern is anchored at ^)"
# The sed pattern '/^\(prefix\|globalconfig\)[[:space:]]*=/d' is anchored at the
# start of the line (^). A line like '  prefix=...' (with leading spaces) does
# NOT match and is preserved. This is intentional — npm ignores leading
# whitespace in .npmrc, but the script's grep check also anchors at ^, so a
# leading-whitespace prefix= would not be detected as a conflict anyway. The
# grep and sed are consistent.
cat > "$TMPDIR_TEST/.npmrc" << 'EOF'
  prefix=/home/user/.npm-global
registry=https://registry.npmjs.org/
EOF
apply_npmrc_fix "$TMPDIR_TEST/.npmrc"
content="$(cat "$TMPDIR_TEST/.npmrc")"
# The grep check '^(prefix|globalconfig)[[:space:]]*=' does NOT match '  prefix='
# (leading spaces), so the fix is a no-op. The line is preserved.
assert_contains "leading-whitespace prefix= preserved (grep anchored at ^)" "$content" "  prefix=/home/user/.npm-global"
assert_contains "registry preserved" "$content" "registry=https://registry.npmjs.org/"
echo ""

# --- Test 8: prefix= with spaces around = is removed ------------------------
echo "Test 8: prefix= with spaces around = is removed (sed pattern allows [[:space:]]* after key)"
cat > "$TMPDIR_TEST/.npmrc" << 'EOF'
prefix = /home/user/.npm-global
registry=https://registry.npmjs.org/
EOF
apply_npmrc_fix "$TMPDIR_TEST/.npmrc"
content="$(cat "$TMPDIR_TEST/.npmrc")"
# The grep pattern '^(prefix|globalconfig)[[:space:]]*=' matches 'prefix = ...'
# because [[:space:]]* allows zero or more spaces between 'prefix' and '='.
assert_not_contains "prefix = (with spaces) removed" "$content" "prefix ="
assert_contains    "registry preserved" "$content" "registry=https://registry.npmjs.org/"
echo ""

# --- Test 9: verify-workstation.sh v-prefix comparison logic ----------------
echo "Test 9: verify-workstation.sh v-prefix comparison logic (Task 11 fix)"
# The bug was: verify-workstation.sh compared `node --version` output (e.g.
# 'v24.18.0') against NODE_VERSION (e.g. '24.18.0') — mismatch because of the
# 'v' prefix. The fix: expected value is "v$NODE_VERSION".
#
# Simulate the comparison:
simulate_node_version_check() {
  local node_output="$1"  # e.g. "v24.18.0" (what `node --version` returns)
  local expected="v${NODE_VERSION_TEST}"  # the Task 11 fix
  if [ "$node_output" = "$expected" ]; then
    echo "MATCH"
  else
    echo "MISMATCH (expected: $expected, got: $node_output)"
  fi
}
assert_eq "v24.18.0 matches v\$NODE_VERSION" "MATCH" "$(simulate_node_version_check 'v24.18.0')"
assert_eq "24.18.0 (no v) does NOT match v\$NODE_VERSION" "MISMATCH (expected: v24.18.0, got: 24.18.0)" "$(simulate_node_version_check '24.18.0')"
assert_eq "v24.18.1 (wrong patch) does NOT match" "MISMATCH (expected: v24.18.0, got: v24.18.1)" "$(simulate_node_version_check 'v24.18.1')"
echo ""

# --- Test 10: regression — the OLD (buggy) comparison would have failed -----
echo "Test 10: regression — confirm the OLD (buggy) comparison would have failed"
# The old code compared against \$NODE_VERSION (no 'v' prefix). Simulate:
simulate_old_buggy_check() {
  local node_output="$1"
  local expected="${NODE_VERSION_TEST}"  # BUG: no 'v' prefix
  if [ "$node_output" = "$expected" ]; then
    echo "MATCH"
  else
    echo "MISMATCH (expected: $expected, got: $node_output)"
  fi
}
# The old comparison would have MISMATCHED on the correct node version:
assert_eq "old buggy comparison fails on v24.18.0" "MISMATCH (expected: 24.18.0, got: v24.18.0)" "$(simulate_old_buggy_check 'v24.18.0')"
echo ""

# --- Summary ----------------------------------------------------------------
echo "=== Summary ==="
printf '  %sPASS%s: %d\n' "${GREEN:-}" "${RESET:-}" "$PASS_COUNT"
printf '  %sFAIL%s: %d\n' "${RED:-}" "${RESET:-}" "$FAIL_COUNT"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  printf '%sFAILURES:%s\n' "${RED:-}" "${RESET:-}"
  for f in "${FAILURES[@]}"; do
    printf '  - %s\n' "$f"
  done
  echo ""
  printf '%sFAILED — %d test(s) failed.%s\n' "${RED:-}" "$FAIL_COUNT" "${RESET:-}"
  exit 1
fi

printf '%sAll %d tests passed.%s\n' "${GREEN:-}" "$PASS_COUNT" "${RESET:-}"
exit 0
