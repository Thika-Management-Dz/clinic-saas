// apps/web/next.config.ts
//
// Next.js 16 configuration. Minimal for Phase 3 scaffold.
// Phase 6 (RTL/i18n) will add the next-intl plugin.
// Phase 9 (PWA & Offline-First) will add Serwist config.

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@clinic-saas/ui', '@clinic-saas/i18n', '@clinic-saas/contracts'],
};

export default nextConfig;
