// @clinic-saas/eslint-config — shared ESLint flat config.
//
// Exports a `createConfig({ next, nest })` factory that returns a
// tseslint.config(...) array. Consumers (apps/web, apps/api, apps/worker)
// call createConfig with the appropriate flags to pull in framework-specific
// rules.
//
// Composition (per Roadmap v2.1 §3.4.2):
//   - @eslint/js recommended
//   - typescript-eslint recommendedTypeChecked
//   - eslint-plugin-import (no-internal-modules — Blueprint §7.4 mandate)
//   - @next/eslint-plugin-next rules (when { next: true })
//   - globals (browser + node as appropriate)
//   - ignores (.next/**, dist/**, coverage/**, node_modules/**)
//
// The custom no-internal-modules rule enforces Blueprint §7.4: a NestJS
// module may import ONLY another module's public API (exported via
// index.ts). Importing another module's internal services is a lint error.
//
// NestJS-specific plugin rules are NOT included in this scaffold. The
// official @nestjs/eslint-plugin does not exist on npm; the community
// eslint-plugin-nestjs is not widely adopted. The base typescript-eslint
// recommendedTypeChecked rules are sufficient for the Phase 3 scaffold.
// NestJS-specific rules can be added in a follow-up if the operator wants
// them (e.g. enforcing decorator metadata conventions).

import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';
import globals from 'globals';

/**
 * @typedef {Object} CreateConfigOptions
 * @property {boolean} [next]  - Enable Next.js plugin rules (for apps/web).
 * @property {boolean} [nest]  - Reserved for future NestJS plugin rules (no-op in this scaffold).
 */

/**
 * Build an ESLint flat config array for a clinic-saas workspace package.
 *
 * @param {CreateConfigOptions} [opts]
 * @returns {Promise<Array>} Resolves to a tseslint.config(...) array.
 */
export async function createConfig(opts = {}) {
  const { next = false, nest = false } = opts;

  /** @type {Array<any>} */
  const configs = [
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        globals: {
          ...globals.node,
          ...(next ? globals.browser : {}),
        },
        parserOptions: {
          // Enable type-aware linting (required by
          // tseslint.configs.recommendedTypeChecked). projectService
          // auto-detects the nearest tsconfig.json for each file —
          // no need to specify tsconfigRootDir or project paths.
          projectService: true,
        },
      },
    },
    {
      plugins: {
        import: importPlugin,
      },
      rules: {
        // Blueprint §7.4: no cross-module internal imports. Only index.ts
        // public APIs may be imported across package boundaries.
        'import/no-internal-modules': [
          'error',
          {
            allow: ['**/src/index.ts'],
          },
        ],
        'import/no-cycle': 'error',
        // NOTE: 'import/order' is disabled because eslint-plugin-import
        // 2.32.0 crashes on ESLint 10.x (getTokenOrCommentAfter was
        // removed from SourceCode in ESLint v10). Re-enable when
        // eslint-plugin-import ships ESLint 10 support. In the meantime,
        // import ordering is enforced by Prettier's import sorting (if
        // configured) or by code review.
        // 'import/order': [
        //   'warn',
        //   {
        //     'newlines-between': 'always',
        //     alphabetize: { order: 'asc', caseInsensitive: true },
        //     groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        //   },
        // ],
      },
    },
    {
      ignores: [
        '.next/**',
        'dist/**',
        'coverage/**',
        'node_modules/**',
        '.turbo/**',
        '**/*.config.js',
        '**/*.config.mjs',
        '**/*.config.ts',
        '**/next-env.d.ts',
      ],
    },
  ];

  // Conditionally pull in the Next.js plugin. Declared as an optional
  // peerDep in package.json so that consumers which don't need it (e.g.
  // packages/db, apps/api) don't have to install it.
  if (next) {
    const nextPlugin = (await import('@next/eslint-plugin-next')).default;
    configs.push({
      plugins: { '@next/next': nextPlugin },
      rules: {
        ...nextPlugin.configs.recommended.rules,
        ...nextPlugin.configs['core-web-vitals'].rules,
      },
    });
  }

  // { nest: true } is accepted but currently a no-op. See header comment.
  if (nest) {
    // TODO: add NestJS-specific rules when a canonical plugin emerges.
    // The base typescript-eslint recommendedTypeChecked rules already
    // cover the most important NestJS linting surface (type safety,
    // unused vars, etc.).
  }

  return configs;
}

export default createConfig;
