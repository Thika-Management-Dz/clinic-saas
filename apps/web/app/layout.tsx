// apps/web/app/layout.tsx
//
// Root layout for the Next.js 16 App Router.
//
// Phase 3 scaffold: minimal. Sets <html lang="ar" dir="rtl"> because
// ar-DZ is the default locale per AGENTS.md i18n Rules. Phase 6
// (RTL/i18n Scaffold) will replace this with a locale-scoped layout
// under app/[locale]/layout.tsx and add the next-intl provider.
//
// No hardcoded user-visible text in this file (per AGENTS.md Do-NOT #4).
// The <title> is empty intentionally; Phase 6 will wire it to next-intl.

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: { default: '', template: '' },
  description: '',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
