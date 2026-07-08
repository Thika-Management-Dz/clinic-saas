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
//     ESLint 10; provides no-cycle, import/order)
//   - no-restricted-imports pattern (@clinic-saas/*/src/** — Blueprint §7.4
//     enforcement; see rule comment below for why this is the sole mechanism)
//   - eslint-import-resolver-typescript (TypeScript-aware resolver; required
//     for the import plugin rules to fire on .ts files)
//   - @next/eslint-plugin-next rules (when { next: true })
//   - clinic-saas custom plugin (when { nest: true }) — currently exposes
//     `clinic-saas/require-inject` enforcing ADR-013's explicit
//     @Inject(Token) rule on NestJS constructor parameters. See
//     ./plugin.js for the rule definition and full rationale.
//   - globals (browser + node as appropriate)
//   - ignores (.next/**, dist/**, coverage/**, node_modules/**)
//
// Blueprint §7.4 enforcement: `no-restricted-imports` with pattern
// `@clinic-saas/*/src/**` (and `@clinic-saas/*/src`) is the SOLE enforcement
// of "no cross-module internal imports". A NestJS module may import ONLY
// another module's public API (exported via `index.ts` or whatever paths the
// package's `exports` field declares, e.g. `./schema`, `./styles/*`).
//
// The `import/no-internal-modules` rule was REMOVED in Task 16. It was kept
// in PR #10 (Task 13) as "defense-in-depth", but a fresh-context review
// (Task 16) found that the rule's `allow: ['**/src/index.ts']` pattern
// blocks legitimate declared subpaths like `@clinic-saas/db/schema` (which
// resolves to `packages/db/src/schema/index.ts` — does NOT match the allow
// pattern because it ends with `/schema/index.ts`, not `/src/index.ts`).
// See the rule comment below and the Task 16 review comment on PR #10 for
// the full analysis.
//
// NestJS-specific rules: the official `@nestjs/eslint-plugin` does not
// exist on npm; the community `eslint-plugin-nestjs` is unmaintained
// (last publish 2022, doesn't support ESLint 9+ flat config). Task 25
// added a project-local `clinic-saas` plugin (./plugin.js) with a
// `require-inject` rule that enforces ADR-013's explicit @Inject(Token)
// pattern. The plugin is registered when `{ nest: true }` is passed.

import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';
import globals from 'globals';

import { clinicSaaSPlugin } from './plugin.js';

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
        // PRIMARY enforcement: `no-restricted-imports` with pattern
        // `@clinic-saas/*/src/**` (and `@clinic-saas/*/src`), which directly
        // blocks any import that reaches into a workspace package's `src/`
        // directory. Imports must go through the package's declared `exports`
        // (e.g. `@clinic-saas/db`, `@clinic-saas/db/schema`,
        // `@clinic-saas/ui`, `@clinic-saas/ui/styles/globals.css`).
        //
        // The `import/no-internal-modules` rule was REMOVED in Task 16.
        // PR #10 (Task 13) kept it as "defense-in-depth" with an `allow`
        // pattern of `['**/src/index.ts']`, but a fresh-context review
        // (Task 16) found that the rule BLOCKS legitimate declared subpaths:
        //   - `@clinic-saas/db/schema` resolves to `packages/db/src/schema/index.ts`
        //     which does NOT match `**/src/index.ts` (ends with `/schema/index.ts`).
        //   - `@clinic-saas/ui/styles/globals.css` resolves to `packages/ui/src/styles/globals.css`
        //     which also does NOT match.
        // Both are declared in their package's `exports` field and are
        // legitimate public APIs per Blueprint §7.4. The rule would have
        // blocked Phase 4's `import { schema } from '@clinic-saas/db/schema'`
        // in apps/api. The `no-restricted-imports` pattern above is sufficient
        // and correct — it blocks `/src/` subpaths syntactically without
        // depending on resolver behavior, and does not block declared
        // subpaths. See Issue #13 (Task 15) and the Task 16 review comment
        // on PR #10 for the full analysis.
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

  // NestJS profile: register the project-local `clinic-saas` plugin
  // and enable the `require-inject` rule enforcing ADR-013. The rule
  // is a no-op in non-NestJS packages (packages/db, packages/auth,
  // apps/web) because they have no NestJS-managed classes — but we
  // still gate the registration on `{ nest: true }` to keep the
  // plugin's surface area explicit and avoid running AST walks
  // against packages that don't need them.
  //
  // See ./plugin.js for the rule definition and ADR-013 for the
  // architectural rationale.
  if (nest) {
    configs.push({
      plugins: {
        'clinic-saas': clinicSaaSPlugin,
      },
      rules: {
        // ADR-013: every constructor-injected provider in a NestJS app
        // MUST use an explicit @Inject(Token) decorator. Implicit
        // injection is undefined at runtime under tsx/esbuild (no
        // emitDecoratorMetadata). This is the proactive enforcement
        // layer; the smoke CI job is the reactive safety net.
        'clinic-saas/require-inject': 'error',
      },
    });
  }

  return configs;
}

export default createConfig;
