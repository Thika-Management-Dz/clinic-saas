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
//   - eslint-plugin-import-x (fork of eslint-plugin-import that supports
//     ESLint 10; provides no-internal-modules, no-cycle, import/order)
//   - no-restricted-imports pattern (@clinic-saas/*/src/** — Blueprint §7.4
//     primary enforcement; see rule comment below for why no-internal-modules
//     alone is insufficient)
//   - eslint-import-resolver-typescript (TypeScript-aware resolver; required
//     for the import plugin rules to fire on .ts files)
//   - @next/eslint-plugin-next rules (when { next: true })
//   - globals (browser + node as appropriate)
//   - ignores (.next/**, dist/**, coverage/**, node_modules/**)
//
// The `import/no-internal-modules` rule enforces Blueprint §7.4: a NestJS
// module may import ONLY another module's public API (exported via
// `index.ts` or whatever paths the package's `exports` field declares).
// Importing another module's internal services is a lint error.
//
// IMPORTANT: this rule ONLY fires when a TypeScript-aware import resolver
// is configured (see the `import/resolver` settings below). Without the
// resolver, eslint-plugin-import's default Node resolver cannot resolve
// `.ts` files or honor the `exports` field of workspace packages, and the
// rule silently skips every check. This was the root cause of Task 13
// BLOCK-1 (PR #8's review incorrectly claimed the rule worked).
//
// NestJS-specific plugin rules are NOT included in this scaffold. The
// official @nestjs/eslint-plugin does not exist on npm; the community
// eslint-plugin-nestjs is not widely adopted. The base typescript-eslint
// recommendedTypeChecked rules are sufficient for the Phase 3 scaffold.
// NestJS-specific rules can be added in a follow-up if the operator wants
// them (e.g. enforcing decorator metadata conventions).

import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import-x';
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
      settings: {
        // REQUIRED for eslint-plugin-import rules (no-internal-modules,
        // no-cycle, no-unresolved) to actually fire on TypeScript files.
        // Without a TypeScript-aware resolver, the default Node resolver
        // cannot resolve `.ts` files or honor the `exports` field of
        // workspace packages, so `no-internal-modules` silently skips
        // every check (the rule's exception handler returns when resolve
        // throws). This was the root cause of Task 13 BLOCK-1.
        // See https://github.com/import-js/eslint-plugin-import#resolvers
        'import/resolver': {
          typescript: {
            // Always resolve via the package's exports map if present.
            // Block any subpath not declared in `exports`.
            alwaysTryTypes: true,
            // Skip type-checking the resolver itself (faster).
            project: true,
          },
          node: true,
        },
      },
    },
    {
      plugins: {
        import: importPlugin,
      },
      rules: {
        // Blueprint §7.4: no cross-module internal imports. Only the public
        // API exported via a package's `exports` field (typically `index.ts`
        // plus declared subpaths like `./schema`, `./styles/*`) may be
        // imported across package boundaries.
        //
        // The `import/no-internal-modules` rule is kept for defense-in-depth
        // (it can catch some cases the patterns below miss, when the resolver
        // resolves a path that the package's `exports` field doesn't allow).
        // However, it does NOT reliably fire on workspace packages because
        // modern resolvers (including eslint-import-resolver-typescript) honor
        // the `exports` field and refuse to resolve non-exported subpaths —
        // when resolution fails, the rule's exception handler silently allows
        // the import. This was Task 13 BLOCK-1.
        //
        // The PRIMARY enforcement is therefore `no-restricted-imports` with
        // pattern `@clinic-saas/*/src/**`, which directly blocks any import
        // that reaches into a workspace package's `src/` directory. Imports
        // must go through the package's declared `exports` (e.g.
        // `@clinic-saas/db`, `@clinic-saas/db/schema`, `@clinic-saas/ui`,
        // `@clinic-saas/ui/styles/globals.css`).
        'import/no-internal-modules': [
          'error',
          {
            allow: ['**/src/index.ts'],
          },
        ],
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@clinic-saas/*/src/**', '@clinic-saas/*/src'],
                message:
                  "Blueprint §7.4: do not import a workspace package's internal src/ files. Import from the package root (e.g. '@clinic-saas/db') or a declared subpath (e.g. '@clinic-saas/db/schema').",
              },
            ],
          },
        ],
        'import/no-cycle': 'error',
        // `import/order` was previously disabled because eslint-plugin-import
        // 2.32.0 crashes on ESLint 10.x (getTokenOrCommentAfter was removed
        // from SourceCode). Switched to `eslint-plugin-import-x` (a fork
        // that supports ESLint 10) per Task 13/14 — this also resolved
        // JC-9-3 (import/order disabled). Re-enabled below.
        'import/order': [
          'warn',
          {
            'newlines-between': 'always',
            alphabetize: { order: 'asc', caseInsensitive: true },
            groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          },
        ],
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
