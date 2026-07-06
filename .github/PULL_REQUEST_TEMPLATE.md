## Summary

<!-- One paragraph: what & why -->

## Motivation

<!-- Link the issue: Closes #N. Why is this change needed? -->

## Changes

<!-- Bullet list of the substantive changes -->

## Test plan

<!-- How did you verify? Commands run, manual steps, screenshots -->

## Screenshots / recordings (mandatory for UI changes)

<!-- ar-DZ (RTL) and fr-DZ (LTR) screenshots for any UI change -->

| ar-DZ (RTL) | fr-DZ (LTR) |
|-------------|-------------|
|             |             |

## Migration included

- [ ] No migration
- [ ] Migration included (forward-only, tested up + down)

## Breaking change

- [ ] No
- [ ] Yes (describe impact + migration path)

## Self-verification checklist

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] AGENTS.md rules respected (RLS, soft deletes, next-intl, logical props)
- [ ] No PII in logs / Sentry / PostHog
- [ ] No hardcoded user-visible strings
- [ ] No physical left/right CSS for layout
- [ ] No FHIR JSON stored internally
- [ ] FDI tooth notation only
- [ ] No new tenant-scoped table without ENABLE + FORCE RLS + tenant_id index

## Assumptions made (for AI-agent PRs)

<!-- Document any assumptions you made when the spec was ambiguous -->
