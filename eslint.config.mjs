// Root eslint.config.mjs
//
// Fallback ESLint config for workspace packages that don't declare their
// own eslint.config.mjs. ESLint 9+ searches up the directory tree from
// the file being linted; the first eslint.config.{js,mjs,cjs} found wins.
//
// Packages with their own eslint.config.mjs (apps/web, apps/api,
// apps/worker) override this with framework-specific config
// (createConfig({ next: true }) / createConfig({ nest: true })).
//
// This root config uses the base profile (no Next.js, no NestJS plugin
// rules) — appropriate for packages/tsconfig, packages/eslint-config,
// packages/db, packages/auth, packages/contracts, packages/i18n,
// packages/ui.

import { createConfig } from '@clinic-saas/eslint-config';

const config = await createConfig({ next: false, nest: false });

export default config;
