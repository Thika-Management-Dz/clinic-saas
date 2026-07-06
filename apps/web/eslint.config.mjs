// apps/web/eslint.config.mjs
//
// Wired to the shared @clinic-saas/eslint-config with the Next.js profile.
// Per ADR-010, the AI Agent Review Session enforces this config per PR.

import { createConfig } from '@clinic-saas/eslint-config';

const config = await createConfig({ next: true, nest: false });

export default config;
