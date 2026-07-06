# RTL Conventions

- **Audience:** AI coding agents and human contributors
- **Blueprint references:** §8.1, §8.2; Roadmap §2.3.2 (Do-NOT list)
- **Locales:** `ar-DZ` (RTL), `fr-DZ` (LTR)

The app serves both right-to-left (Arabic) and left-to-right (French) users,
often in the same clinic on the same day (a francophone dentist and an
arabophone receptionist). The layout must **flip correctly** when the locale
changes, with **zero** physical-left/right CSS in the codebase.

## 1. The single rule

> **Use Tailwind v4 logical properties only. NEVER use physical `left` /
> `right` for layout.**

Tailwind v4 ships native CSS logical properties — no plugin needed. Use:

| ❌ Physical (DON'T) | ✅ Logical (DO) | Notes |
|---|---|---|
| `ml-2`, `mr-2` | `ms-2`, `me-2` | margin-inline-start / margin-inline-end |
| `pl-2`, `pr-2` | `ps-2`, `pe-2` | padding-inline-start / padding-inline-end |
| `left-0`, `right-0` | `start-0`, `end-0` | inset-inline-start / inset-inline-end |
| `text-left`, `text-right` | `text-start`, `text-end` | text-align start / end |
| `float-left`, `float-right` | use flex / grid | floats are physical; avoid |
| `border-l`, `border-r` | `border-s`, `border-e` | border-inline-start / border-inline-end |
| `rounded-l`, `rounded-r` | `rounded-s`, `rounded-e` | corner radii on start/end side |
| `space-x-2` (children reversed in RTL) | `gap-2` on flex parent | gap is direction-agnostic |
| `inset-x-0` | `inset-inline-0` | inline-axis inset |

`tailwind.config.ts` sets `rtl: true` (and shadcn/ui is configured with
`rtl: true`); Tailwind v4 auto-generates the `:dir(rtl)` / `:dir(ltr)`
variants and logical-property utilities.

## 2. The `dir` attribute

The `<html>` element carries `dir="rtl"` for `ar-DZ` and `dir="ltr"` for
`fr-DZ`. Next-intl sets this automatically via the App Router middleware.
**Every page** inherits the correct direction; component-level `dir`
overrides are forbidden unless the component embeds foreign-direction
content (e.g., a French quote inside an Arabic SOAP note — rare).

## 3. shadcn/ui — `rtl: true`

shadcn/ui (Base UI + Tailwind, MIT) shipped first-class RTL in January 2026.
Configure with `rtl: true` in `components.json`:

```jsonc
{
  "rtl": true,
  "style": "new-york",
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate"
  }
}
```

This makes Popover, Dialog, Tooltip, DropdownMenu, Select, etc. position
their content using logical properties so they flip automatically.

## 4. Icon mirroring — directional icons only

Directional icons (chevrons, arrows, "send" paper-plane, "list-bullet")
must **flip in RTL** so they point in the reading direction. Use a
`<DirectionalIcon>` wrapper or Tailwind's `rtl:rotate-180` variant:

```tsx
// ✅ Correct — flips in RTL
<button>
  {t('common.next')}
  <ChevronRightIcon className="size-4 rtl:rotate-180" />
</button>

// ❌ Wrong — points the wrong way in RTL
<button>
  {t('common.next')}
  <ChevronRightIcon className="size-4" />
</button>
```

**Non-directional icons** (a stethoscope, a tooth, a pill, a save floppy) do
**not** flip — flipping a stethoscope in RTL is a beginner mistake that
makes the UI look broken.

| Icon | Directional? | Flip in RTL? |
|---|---|---|
| `ChevronRight`, `ArrowRight`, `ArrowLeft` | yes | yes |
| `Send` (paper plane) | yes | yes |
| `ListBullet` | yes (bullet on the start side) | yes |
| `Undo`, `Redo` | yes | yes |
| `Stethoscope`, `Tooth`, `Pill`, `Save`, `Trash`, `Search`, `Bell`, `User` | no | no |
| `AlignStart`, `AlignEnd` | yes (semantic, points to start/end) | yes |

## 5. Charts — RTL axis audit

Chart libraries (Recharts, Visx, ECharts) default to LTR axis layout. In an
RTL layout, the X-axis should typically run **right-to-left** for
time-series (newest on the right becomes newest on the left), and bar-chart
categories should be ordered start-to-end.

**Mandatory audit for every chart:**

1. Does the X-axis reverse in RTL? (For time-series: yes; for categorical:
   depends on the semantic — a "performance over time" chart reverses; a
   "treatment breakdown by tooth" chart does not.)
2. Are axis labels positioned with logical properties (`end` instead of
   `right`)?
3. Does the legend read start-to-end?
4. Are tooltips positioned with logical properties?

Recharts example (RTL-aware):

```tsx
<XAxis
  dataKey="day"
  reversed={isRtl}                  // flip the axis
  tickMargin={8}
  label={{ value: t('charts.day'), position: 'insideBottom', offset: -2 }}
/>
<YAxis
  orientation={isRtl ? 'right' : 'left'}  // Recharts has no logical-prop API; gate on isRtl
/>
<Tooltip contentStyle={{ direction: isRtl ? 'rtl' : 'ltr' }} />
```

(Recharts's API is physical-side-oriented; we wrap it. ECharts has native
RTL support — prefer ECharts for new charts if Recharts's RTL story becomes
a maintenance burden.)

## 6. Correct vs incorrect — concrete examples

### 6.1 Card with icon + title + action

```tsx
// ❌ Wrong — breaks in RTL: icon glued to physical-left, action to physical-right
<div className="flex items-center justify-between">
  <div className="flex items-center">
    <UserIcon className="size-5 mr-2" />
    <h2>{t('patients.list.title')}</h2>
  </div>
  <button className="ml-4">{t('common.add')}</button>
</div>

// ✅ Correct — flips in RTL via logical props
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <UserIcon className="size-5" />
    <h2>{t('patients.list.title')}</h2>
  </div>
  <button className="ms-4">{t('common.add')}</button>
</div>
```

### 6.2 Drawer / sheet positioning

```tsx
// ❌ Wrong — always opens from the right, even in RTL
<Sheet side="right">

// ✅ Correct — opens from the start side, which is right in LTR and left in RTL
<Sheet side="start">
```

### 6.3 Form label + input

```tsx
// ❌ Wrong — label glued to physical-left, breaks RTL
<label className="block text-left mb-1">{t('patients.form.familyName')}</label>
<input className="w-full pl-3" />

// ✅ Correct
<label className="block text-start mb-1">{t('patients.form.familyName')}</label>
<input className="w-full ps-3" />
```

### 6.4 Toast / notification position

```tsx
// ❌ Wrong — always top-right
<Toaster position="top-right" />

// ✅ Correct — top-start = top-right in LTR, top-left in RTL
<Toaster position="top-start" />
```

## 7. CI enforcement

- An ESLint rule (or a custom script) **fails the PR** if any of the
  physical-left/right utility classes appear in `.tsx`/`.jsx`:
  `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`,
  `border-l`, `border-r`, `rounded-l`, `rounded-r`, `space-x-`,
  `space-y-` (the last is fine for vertical, but Tailwind v4 prefers `gap`).
- The Playwright + axe-core suite (see `docs/conventions/testing.md` §3.4)
  scans every golden path **in both locales**. Critical a11y violations in
  either locale fail the PR.

## 8. Pseudo-RTL in dev

For LTR-first developers: temporarily set `<html dir="rtl">` globally during
local dev to surface physical-property bugs immediately. Better: run the
Playwright suite in `ar-DZ` locally before pushing.
