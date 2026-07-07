# Security Policy

## Supported Versions

This project is pre-1.0 and ships from `main` only. We do not backport
security fixes to release branches; upgrade to the latest `main` commit for
security patches.

| Version | Supported          |
|---------|--------------------|
| `main`  | :white_check_mark: |
| tags    | :x: (no releases yet) |

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Please report vulnerabilities through one of these private channels:

1. **GitHub Security Advisories** (preferred):
   <https://github.com/Thika-Management-Dz/clinic-saas/security/advisories/new>
   This uses GitHub's private vulnerability reporting flow — the report is
   visible only to repository maintainers and is not publicly disclosed until
   a fix is shipped.
2. **Email the operator**: contact `@AguHo` via the GitHub organization
   (<https://github.com/Thika-Management-Dz>) — open a private message
   referencing this `SECURITY.md`.

Please include in your report:

- A description of the issue and its potential impact.
- The commit SHA or branch where the issue was observed.
- Steps to reproduce (PoC, minimal example).
- Any suggested remediation.

## Response SLA

We aim to acknowledge reports within **48 hours** and to ship a fix or
mitigation according to the following severity targets:

| Severity | Acknowledge | Fix target              |
|----------|-------------|-------------------------|
| P0 (blocker — patient-data exposure, auth bypass, RLS break) | 48 h | 7 days (hotfix to `main`) |
| P1 (high — privilege escalation, audit-log tamper path, secrets leak) | 48 h | 30 days |
| P2 (medium) | 72 h | 60 days |
| P3 (low / hardening) | 1 week | 90 days |

If a report is accepted as a P0/P1 vulnerability, we will coordinate a
disclosure date with you. We publish a
[GitHub Security Advisory](https://github.com/Thika-Management-Dz/clinic-saas/security/advisories)
with a CVE once the fix is shipped, crediting the reporter unless they prefer
to remain anonymous.

## Regulatory context — Algerian Law 18-07 (amended by Law 25-11)

This project processes patient-identifiable health data subject to Algerian
data-protection Law 18-07 (amended by Law 25-11) and health-records Law
18-11. A security vulnerability that exposes patient data may also be a
**personal data breach** under Law 25-11, triggering a **5-day notification
SLA** to the ANPDP (Autorité nationale de protection des données à
caractère personnel).

If a vulnerability you report involves actual or potential exposure of
patient data, the breach-response procedure in
[`docs/runbooks/breach-response.md`](./docs/runbooks/breach-response.md)
applies in addition to this policy. The 5-day ANPDP clock starts when the
breach is confirmed, not when it is reported — please report promptly.

## Scope

In scope:

- All code under `apps/`, `packages/`, `scripts/`, `tests/` in this repo.
- The CI/CD configuration under `.github/workflows/`.
- Database schema and RLS policies under `packages/db/sql/` and
  `packages/db/src/schema/`.
- The deployed NestJS API, web app, and worker (when they exist).

Out of scope:

- Vulnerabilities in third-party dependencies — report these upstream.
  We use Renovate + Dependabot to track dependency CVEs and ship updates
  weekly.
- Findings from automated scanners (e.g., gitleaks) that are already
  reported as `N/A` or `false-positive` in the repository's baseline.
- Self-XSS or social-engineering attacks requiring user cooperation.
- Volume-based DoS on the public API (mitigated by rate-limiting in
  Phase 5+, see roadmap §2.5).

## Secret hygiene

This repository is public. **Never commit real secrets** (database
passwords, API tokens, private keys, `.env` files) to any branch or PR
description.

We use two automated secret-scanning layers (added in PR #28, see
[`docs/remediation/30-60-90-day-plan.md`](./docs/remediation/30-60-90-day-plan.md)):

1. **gitleaks pre-commit hook** (`.pre-commit-config.yaml`) — runs locally
   on every commit. Install with `pre-commit install` after cloning.
2. **gitleaks GitHub Action** (`.github/workflows/gitleaks.yml`) — runs on
   every PR and on every push to `main`. A finding fails the CI check and
   blocks merge.

If you accidentally commit a secret:

1. **Rotate the secret immediately** at its source (Neon dashboard, GitHub
   settings, etc.).
2. Follow the breach-response procedure in
   [`docs/runbooks/breach-response.md`](./docs/runbooks/breach-response.md)
   if the secret protects patient data.
3. Open a PR that removes the secret and references this `SECURITY.md`.

Force-pushing to remove a secret from history is insufficient — rotate the
secret. Anyone who fetched the commit before the force-push has the secret.

## License & security research

This project is currently MIT-licensed (see [`LICENSE`](./LICENSE)). Per
[ADR-009](./docs/adr/ADR-009.md), the license will transition to Elastic
License 2.0 or BUSL-1.1 before commercial launch. Security research conducted
in good faith and following responsible-disclosure norms (this policy) is
welcome and will not result in legal action.

## References

- [`AGENTS.md`](./AGENTS.md) — architecture rules, including the Do-NOT list.
- [`docs/adr/ADR-009.md`](./docs/adr/ADR-009.md) — licensing decision.
- [`docs/adr/ADR-011.md`](./docs/adr/ADR-011.md) — secrets-management posture.
- [`docs/runbooks/breach-response.md`](./docs/runbooks/breach-response.md) —
  ANPDP 5-day breach-response SLA.
- [`docs/runbooks/ci.md`](./docs/runbooks/ci.md) — CI workflow + gitleaks policy.
- [`docs/audits/2026-07-07-critical-review.pdf`](./docs/audits/2026-07-07-critical-review.pdf) —
  the 23-page pre-production audit this policy was informed by.
