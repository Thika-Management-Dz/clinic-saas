// packages/ui/src/index.ts
//
// Public API for the @clinic-saas/ui package. Re-exports shadcn/ui
// components so that apps/web can `import { Button } from '@clinic-saas/ui'`.
//
// Phase 3 scaffold: empty. The 13 shadcn components listed in Roadmap
// v2.1 §3.10.2 (Button, Input, Label, Dialog, DropdownMenu, Sonner,
// Avatar, Badge, Card, Form, Table, Tabs, Tooltip) will be added in a
// follow-up PR or in Phase 6 (RTL/i18n Scaffold) when the design system
// is wired into apps/web.
//
// Configuration already in place (so `shadcn add <component>` will work
// without further setup):
//   - components.json: style=new-york, baseColor=slate, cssVariables=true,
//     rsc=true, tsx=true, iconLibrary=lucide
//   - src/lib/utils.ts: cn() helper (clsx + tailwind-merge)
//   - src/styles/globals.css: Tailwind v4 import + shadcn CSS variables
//     (slate base color, light + dark themes, RTL-aware via logical
//     properties only — no physical left/right)
//
// AGENTS.md RTL rule: components use Tailwind v4 logical properties ONLY
// (ms-, me-, ps-, pe-, start-, end-, text-start, text-end). shadcn/ui is
// configured with rtl: true (per AGENTS.md).

export {};
