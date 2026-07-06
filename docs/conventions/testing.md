# Testing Conventions

- **Audience:** AI coding agents and human contributors
- **Blueprint references:** §14.2, §14.3; Roadmap Phase 8
- **Enforcement:** CI gates on every PR; no PR merges with red CI

## 1. Stack

| Layer | Tool | Purpose |
|---|---|---|
| Unit / integration | **Vitest** | Pure functions, services with mocked deps, Drizzle schema validation |
| E2E | **Playwright** | Golden-path UI flows per domain module, in a real browser |
| API mocking | **MSW** (Mock Service Worker) | Component tests and Storybook stories without a backend |
| Accessibility | **axe-core** (via `@axe-core/playwright`) | WCAG 2.2 AA gating for **both** `fr-DZ` (LTR) and `ar-DZ` (RTL) layouts |
| Performance | **Lighthouse CI** + **k6** | Frontend budgets (PR) and load profiles (release/quarterly) |
| Type checking | `tsc --noEmit` | Every PR |
| Lint | ESLint (flat config) | Every PR; includes module-boundary rule (no internal cross-module imports — ADR-002) |

## 2. The PR gate

Every PR must pass, in CI, before merge:

```bash
pnpm lint
pnpm typecheck
pnpm test            # Vitest unit + integration
pnpm test:e2e        # Playwright golden paths (PR subset)
pnpm build           # Next.js + NestJS build
```

On merge to `main`: full Playwright suite against staging, then deploy.
On tag (release): smoke tests post-deploy.

A PR is **not mergeable** until all green AND one human review AND an
AI-PR-review-bot pass (Roadmap §2.6).

## 3. What we test (concrete examples)

### 3.1 Pure functions — always tested

Pure functions are the highest-leverage test targets because they are
deterministic and fast. **Every pure function in `packages/contracts` MUST
have unit tests.** Three non-negotiable examples:

#### (a) Canonical JSON for the audit-log hash chain [Blueprint §9.7]

```ts
// packages/contracts/src/audit/canonical-json.test.ts
import { canonicalJson } from './canonical-json';

describe('canonicalJson (audit-log hash chain input)', () => {
  it('produces a stable byte-for-byte identical string regardless of key insertion order', () => {
    const a = { tenant_id: 't1', action: 'patient.update', entity_id: 'p1', after: { given_name: 'Ahmed' } };
    const b = { after: { given_name: 'Ahmed' }, entity_id: 'p1', action: 'patient.update', tenant_id: 't1' };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
  });

  it('escapes Unicode control characters and sorts nested keys deeply', () => {
    expect(canonicalJson({ b: { d: 1, c: 2 }, a: 3 }))
      .toBe('{"a":3,"b":{"c":2,"d":1}}');
  });

  it('rejects undefined, functions, and symbols (throw, not silently drop)', () => {
    expect(() => canonicalJson({ x: undefined })).toThrow();
    expect(() => canonicalJson({ x: () => 0 })).toThrow();
  });
});
```

The audit log's tamper-evidence depends on `hash_curr = SHA-256(prev_hash ||
canonical_json(this_row))`. If canonical JSON were not byte-stable across
key-order variations, the chain would break on every refactor. This test
must never go red in production.

#### (b) FDI tooth validation [ADR-007]

```ts
// packages/contracts/src/dental/fdi.test.ts
import { validFdi } from './fdi';

describe('validFdi (ISO 3950:2016)', () => {
  it.each([11, 18, 21, 28, 31, 38, 41, 48])('accepts permanent tooth %i', (n) => {
    expect(validFdi(n)).toBe(true);
  });
  it.each([51, 55, 61, 65, 71, 75, 81, 85])('accepts primary tooth %i', (n) => {
    expect(validFdi(n)).toBe(true);
  });
  it.each([10, 19, 20, 29, 38.5, 56, 99, 0, -11, 100])('rejects %i', (n) => {
    expect(validFdi(n)).toBe(false);
  });
});
```

#### (c) Algerian TVA computation [Blueprint §9.6.1]

```ts
// packages/contracts/src/billing/tva.test.ts
import { computeLineTotals, TvaClass } from './tva';

describe('computeLineTotals (Algerian TVA)', () => {
  it('exempts medical acts (tva_rate = 0)', () => {
    const r = computeLineTotals({ unit_price_ht: 5000, quantity: 1, tva_rate: 0 });
    expect(r.line_total_ht).toBe(5000);
    expect(r.tva_amount).toBe(0);
    expect(r.line_total_ttc).toBe(5000);
  });

  it('applies reduced 9% on non-medical services', () => {
    const r = computeLineTotals({ unit_price_ht: 1000, quantity: 2, tva_rate: 9 });
    expect(r.line_total_ht).toBe(2000);
    expect(r.tva_amount).toBe(180);
    expect(r.line_total_ttc).toBe(2180);
  });

  it('applies standard 19% on retail products', () => {
    const r = computeLineTotals({ unit_price_ht: 1000, quantity: 1, tva_rate: 19 });
    expect(r.line_total_ttc).toBe(1190);
  });

  it('rejects invalid tva_rate values', () => {
    expect(() => computeLineTotals({ unit_price_ht: 1000, quantity: 1, tva_rate: 5 }))
      .toThrow(/tva_rate must be 0, 9, or 19/);
  });
});
```

### 3.2 RLS cross-tenant isolation test

A non-negotiable CI test asserts that **no tenant-scoped table leaks data
across tenants** [Blueprint §14.2]:

```ts
// packages/api/test/rls-isolation.test.ts
import { createTestContext, setTenant, db } from './helpers';

describe('RLS cross-tenant isolation', () => {
  it('tenant A cannot read tenant B patient rows', async () => {
    const ctx = await createTestContext();
    const patientB = await setTenant(ctx, 'tenant-b')
      .insert(db.patient, { family_name: 'Benali' });

    const rowsFromA = await setTenant(ctx, 'tenant-a')
      .select(db.patient);
    expect(rowsFromA.find(p => p.id === patientB.id)).toBeUndefined();
  });

  it('FORCE ROW LEVEL SECURITY is set on every tenant-scoped table', async () => {
    const tables = await db.execute(sql`
      SELECT relname FROM pg_class
      WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
        AND relname NOT IN ('clinic', 'app_user')
    `);
    for (const { relname } of tables) {
      const [{ relrowsecurity, relforcerowsecurity }] = await db.execute(sql`
        SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = ${relname}
      `);
      expect(relrowsecurity, `${relname} ENABLE RLS`).toBe(true);
      expect(relforcerowsecurity, `${relname} FORCE RLS`).toBe(true);
    }
  });
});
```

### 3.3 E2E golden path per domain module

Every domain module (patient, appointment, encounter, dental, billing, …)
has **one** Playwright golden-path test in `apps/web/e2e/<module>.spec.ts`
that walks the canonical happy path end-to-end in a real browser. Examples:

- `patient.spec.ts` — receptionist logs in → creates a patient → soft-deletes → restores.
- `appointment.spec.ts` — receptionist books → patient arrives → encounter started.
- `dental.spec.ts` — dentist opens odontogram → records an MOD amalgam on tooth 36 → saves.
- `billing.spec.ts` — billing clerk creates invoice → applies TVA classes → marks paid by cash.

Each golden path runs in **both** locales (`ar-DZ` RTL and `fr-DZ` LTR).
axe-core scans run as part of each step.

### 3.4 Accessibility — WCAG 2.2 AA

```ts
// apps/web/e2e/a11y.spec.ts
import { AxeBuilder } from '@axe-core/playwright';

for (const locale of ['ar-DZ', 'fr-DZ']) {
  test(`patient chart has no critical a11y violations (${locale})`, async ({ page }) => {
    await page.goto(`/ar/patients/123`.replace('/ar/', `/${locale.slice(0,2)}/`));
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });
}
```

Critical violations **fail the PR** in both locales.

## 4. Performance budgets (PR gate)

Lighthouse CI runs on every PR against the built Next.js app and gates on:

| Metric | Threshold |
|---|---|
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 90 |
| SEO | ≥ 90 |

k6 profiles run on release (50 VUs/clinic, 10 min) and quarterly (stress:
200 VUs, 30 min; spike: instant ramp to 100 VUs). See Blueprint §14.3.

## 5. What NOT to test

- **Don't** write tests that mock the entire world and assert on mock calls
  — they break on every refactor and verify nothing.
- **Don't** test Drizzle's own SQL generation; test the schemas (constraints,
  indexes, RLS) and the repository functions that use them.
- **Don't** write snapshot tests for UI components unless the snapshot is
  small and intentional (visual regression is handled by Playwright +
  Percy/Chromatic if added later).

## 6. Test data

- Use **faker-seeded pseudonymized data** (Blueprint §12.4) — never real
  patient data in test fixtures.
- The seed should be deterministic (`faker.seed(42)`) so test failures are
  reproducible.
- Cross-tenant tests use two tenants (`tenant-a`, `tenant-b`) by convention.
