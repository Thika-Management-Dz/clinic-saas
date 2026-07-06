// apps/api/eslint.config.mjs
//
// Wired to the shared @clinic-saas/eslint-config with the NestJS profile.
// Note: { nest: true } is currently a no-op in the shared config because
// the official @nestjs/eslint-plugin does not exist on npm (see
// packages/eslint-config/flat-config.js header comment). Base
// typescript-eslint recommendedTypeChecked rules cover the important
// surface. Phase 7/8 may add a community NestJS plugin if needed.

import { createConfig } from '@clinic-saas/eslint-config';

const config = await createConfig({ next: false, nest: true });

export default config;
