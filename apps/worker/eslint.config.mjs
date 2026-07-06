// apps/worker/eslint.config.mjs
//
// Wired to the shared @clinic-saas/eslint-config with the NestJS profile.
// Same note as apps/api: { nest: true } is currently a no-op.

import { createConfig } from '@clinic-saas/eslint-config';

const config = await createConfig({ next: false, nest: true });

export default config;
