# Runbook: AI Agent PR Review Session

> **Purpose:** step-by-step procedure for running an AI agent review session on
> a pull request. This replaces the always-on AI PR review bot described in
> Roadmap v2.1 §2.6 (superseded by [ADR-010](../adr/ADR-010.md)).
>
> **Audience:** the operator (solo vibe-coder) using their chosen AI agent tool.
> The procedure is tool-agnostic — the review prompt and checklist below work
> with any AI coding agent that can read a diff and post a GitHub comment.

## When to run

- After a PR is opened (by you or by a coding agent) AND you consider it ready
  for review (not WIP / draft).
- Before merging.
- Once per PR is the minimum; re-run after significant changes if the PR was
  force-pushed to.

## What you need

- The PR number and URL on
  `https://github.com/Thika-Management-Dz/clinic-saas`.
- Your chosen AI agent tool (the same one you use for coding).
- This runbook (for the review prompt and checklist below).

## Steps

### 1. Fetch the PR diff

```bash
gh pr diff <PR-NUMBER> > /tmp/pr-<PR-NUMBER>.diff
```

Or, if your AI agent tool can fetch a GitHub diff directly, point it at:

```
https://github.com/Thika-Management-Dz/clinic-saas/pull/<PR-NUMBER>.diff
```

### 2. Open a FRESH AI agent session (review mode)

Start a **new** session. Do **not** reuse the coding agent's session — the
author agent will rationalize its own choices and miss its own violations. A
fresh context is the whole point.

### 3. Feed the session this prompt (copy-paste verbatim)

```
You are reviewing a pull request for the Clinic Management SaaS project
(repo: Thika-Management-Dz/clinic-saas). Your job is to enforce the project's
AGENTS.md rules on the diff below. Be specific and cite the rule violated.

Read these files first (they are the source of truth):
- AGENTS.md
- docs/adr/ (ADR-001..010)
- docs/conventions/{testing,i18n,rtl,naming}.md

Then review the diff against this checklist. For each item, output exactly one
of:
- PASS  — rule respected
- BLOCK — rule violated, must fix before merge (cite file:line + the rule)
- NIT   — suggestion only, non-blocking
- N/A   — rule does not apply to this diff

Checklist:
 1. Multi-tenancy: every new tenant-scoped table has tenant_id, ENABLE + FORCE
    ROW LEVEL SECURITY, and a tenant_id index. No RLS-disabled tenant table.
 2. Soft deletes: no DELETE on tenant-scoped/clinical tables. Mutations use
    deleted_at.
 3. Audit: every mutation goes through the audit writer / AuditInterceptor.
    No silent writes.
 4. i18n: no hardcoded user-visible strings. Every label/tooltip/button goes
    through next-intl t(). Message keys namespaced correctly.
 5. RTL: no physical left/right CSS or ml-/mr-/pl-/pr- for layout. Only Tailwind
    logical properties (ms-/me-/ps-/pe-/start-/end-/text-start/end). Directional
    icons mirror in RTL.
 6. Dental: FDI ISO 3950:2016 tooth notation only (no Universal/Palmer).
    Surfaces as bitfield INT. tooth_fdi validated against {11..18,21..28,
    31..38,41..48,51..55,61..65,71..75,81..85}.
 7. Billing: per-line tva_rate (0/9/19), tva_class enum, DGI mentions present,
    currency column default 'DZD' (not hardcoded).
 8. No FHIR JSON stored internally (lean tables only; FHIR at the integration
    boundary via NationalInteropAdapter).
 9. No PII in logs / Sentry / PostHog / console.log.
10. No cross-module internal-service imports (only index.ts public APIs).
11. No cross-module direct service calls for writes (use EventEmitter2 /
    equivalent event bus).
12. Appointments: status state machine respected (proposed→pending→booked→
    arrived→in-progress→fulfilled; cancelled/no-show terminal). Double-booking
    prevention present on booking endpoints.
13. Types: strict TS, no `any` without justification, noUncheckedIndexedAccess
    respected.
14. Tests: new logic has unit/integration tests. Pure functions (FDI validation,
    TVA computation, audit hash chain) tested.
15. Self-verification: the PR author ran pnpm lint && pnpm typecheck && pnpm test
    (per the PR template checklist).

Output format:
- A markdown table: | # | Severity | Rule | File:line | Note |
- A one-line verdict: MERGE-READY | FIX-NEEDED

Diff:
<<<paste the diff here, or attach the .diff file>>>
```

### 4. Collect the session's output

The session produces a findings table and a verdict. Triage:

- **BLOCK** → must fix before merge. Either fix yourself or re-dispatch the
  coding agent with the findings as a follow-up issue. Do not merge until every
  BLOCK is resolved and re-reviewed.
- **NIT** → optional. Apply if cheap; otherwise note in the PR and move on.
- **PASS / N/A** → no action.

### 5. Post the session outcome as a PR comment

On the PR (`https://github.com/Thika-Management-Dz/clinic-saas/pull/<N>`), post
a comment using this template:

```
## AI Agent Review Session

- **Session tool:** <your AI agent tool name>
- **Session date:** <YYYY-MM-DD HH:MM> TZ
- **Session transcript:** <link, if your tool exposes one; else "n/a">
- **Outcome:** ✅ PASS  |  ⚠️ PASS-WITH-NITS  |  ❌ BLOCKED

### Findings

| # | Severity | Rule | File:line | Note |
|---|----------|------|-----------|------|
| 1 | BLOCK    | RTL  | foo.tsx:42 | used `ml-2` instead of `ms-2` |
| 2 | NIT      | i18n | bar.ts:10  | message key could be namespaced |

### Verdict

<one sentence: merge-ready or fix-needed>
```

Post it with the `gh` CLI:

```bash
gh pr comment <PR-NUMBER> --body-file /tmp/review-<PR-NUMBER>.md
```

### 6. Resolve BLOCKs (if any)

If the session found BLOCKs:

1. Do **not** merge.
2. Either fix the findings yourself, or open a follow-up agent-task issue
   referencing the PR with the BLOCK list.
3. Push fixes to the same branch.
4. Re-run the review session (step 2 onwards) on the new diff.
5. Post a **new** outcome comment. Do not edit the old one — the comment
   history is part of the audit trail.

### 7. Merge

Once the session outcome is ✅ PASS or ⚠️ PASS-WITH-NITS (with nits accepted),
and the human review is done, merge via **squash** (the repo enforces linear
history).

## Notes

- **Cost discipline.** A review session is cheaper than a coding session because
  the diff is small. But it is not free. Batch-review related PRs in one session
  if your tool allows multi-file context.
- **Audit trail.** The PR comment is the auditable record that a review session
  ran. Do **not** delete review comments — they are part of the compliance
  trail (HIPAA 45 CFR §164.312(b) "audit controls" precedent; ANPDP expects the
  same). The comment timestamp + tool name + outcome constitute the record.
- **Tool rot.** If you switch AI agent tools, update only the "Session tool"
  field in the comment template; the review prompt and checklist are
  tool-agnostic.
- **Evolution.** When AGENTS.md gains a new rule, add a matching item to the
  checklist in step 3, in the same PR that adds the rule to AGENTS.md. This
  keeps the review prompt and the rules in lockstep.
- **Phase 7 upgrade path.** If the manual session proves insufficient (volume,
  consistency, or enforcement), ADR-010 alternative #2 (a GitHub Actions
  workflow running a local AI review on PR open) can be implemented as a Phase 7
  enhancement. The review prompt in this runbook would be reused verbatim.
