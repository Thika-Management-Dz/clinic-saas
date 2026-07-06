// apps/web/app/page.tsx
//
// Home page for Phase 3 scaffold.
//
// Per AGENTS.md Do-NOT #4 ("Do NOT hardcode user-visible text — not even
// a single label"), this page renders NO user-visible text. It's a
// styled placeholder that proves the Next.js + Tailwind + @clinic-saas/ui
// pipeline works end-to-end (CSS variables resolve, layout renders).
//
// Phase 6 (RTL/i18n Scaffold) will replace this with a real homepage
// using next-intl: t('common.appName'), t('patients.title'), etc.
// Phase 10 (Core Domain Modules) will add the actual dashboard.
//
// The page uses ONLY Tailwind logical properties (ms-, me-, ps-, pe-,
// start-, end-, text-start, text-end) per AGENTS.md RTL Rules. No
// physical left/right, no ml-/mr-/pl-/pr-.

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="rounded-lg border border-border p-8 shadow-sm">
        <div className="h-2 w-16 rounded bg-primary" />
      </div>
    </main>
  );
}
