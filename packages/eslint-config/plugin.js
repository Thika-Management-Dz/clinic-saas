// @clinic-saas/eslint-config — custom ESLint plugin.
//
// Exposes project-specific rules under the `clinic-saas` plugin namespace.
// Consumed by flat-config.js (registered as `plugins: { 'clinic-saas': plugin }`).
//
// Rules live here (instead of being inlined into flat-config.js) so that:
//   - The flat-config.js file stays focused on composition (which plugins,
//     which shared configs, which global rules).
//   - Each rule is independently testable and documentable.
//   - Adding a future rule (e.g. enforcing FDI tooth notation, or
//     no-PII-in-logger-calls) follows the same pattern: add a key to
//     `rules` below, register it in flat-config.js.
//
// ## Rule: `clinic-saas/require-inject`
//
// Enforces ADR-013: every constructor-injected provider in a NestJS app
// MUST use an explicit `@Inject(Token)` decorator. Implicit constructor
// injection (relying on TypeScript's `emitDecoratorMetadata`) is broken
// under tsx/esbuild, which the project uses for dev-mode execution —
// esbuild does NOT emit `design:paramtypes` metadata, so NestJS's DI
// container resolves injected dependencies to `undefined` at runtime.
//
// ### What the rule flags
//
// A constructor parameter is flagged when ALL of the following hold:
//   1. The parameter has a TypeScript type annotation.
//   2. The parameter has NO `@Inject(...)` decorator.
//   3. The parameter has NO request-scoped NestJS parameter decorator
//      (`@Req`, `@Res`, `@Body`, `@Query`, `@Param`, `@Headers`,
//      `@Session`, `@HostParam`, `@Ip`, `@UploadedFile`,
//      `@UploadedFiles`, or their `@Request`/`@Response` aliases).
//      These are resolved by NestJS's router from the incoming HTTP
//      request, NOT by the DI container, so they don't need `@Inject`.
//   4. The enclosing class has at least one class-level decorator.
//      This filter prevents the rule from firing on plain classes
//      that aren't NestJS-managed (test mocks, DTOs, value objects).
//      Every NestJS-managed class (`@Controller`, `@Injectable`,
//      `@Catch`, `@Module`, `@WebSocketGateway`) has a class-level
//      decorator by definition.
//
// ### Examples
//
// ```typescript
// // ✅ passes — explicit @Inject(Token)
// @Controller()
// export class HealthController {
//   constructor(@Inject(HealthService) private readonly health: HealthService) {}
// }
//
// // ❌ fails — implicit injection (undefined at runtime under tsx)
// @Controller()
// export class HealthController {
//   constructor(private readonly health: HealthService) {}
// }
//
// // ✅ passes — request-scoped decorator, not DI
// @Controller('auth')
// export class AuthController {
//   @Post('switch-tenant')
//   async switchTenant(@Req() req: FastifyRequest,
//                      @Body() body: SwitchTenantDto): Promise<void> {}
// }
//
// // ✅ passes — class has no class-level decorator (skip entirely)
// class MockFoo {
//   constructor(private readonly bar: Bar) {}  // test mock, not NestJS-managed
// }
//
// // ✅ passes — no type annotation (untyped, no DI inference attempted)
// @Injectable()
// export class Foo {
//   constructor(bar) {}  // no type annotation — rule doesn't fire
// }
// ```
//
// ### Why no-restricted-syntax wasn't sufficient
//
// `no-restricted-syntax` matches PRESENCE of a pattern, not ABSENCE.
// Expressing "constructor parameter with a type annotation but WITHOUT
// an `@Inject` decorator" requires checking the absence of a sibling
// decorator node, which `no-restricted-syntax` cannot do. A custom
// rule with AST-walking logic is the cleanest solution. See ADR-013's
// "Compliance" section for the full rationale.
//
// ### Disabling
//
// Per-line disable (use sparingly — document why in a comment):
//   // eslint-disable-next-line clinic-saas/require-inject
//   constructor(private readonly bar: Bar) {}  // mock, not NestJS-managed
//
// Per-file disable (only for test fixtures that intentionally exercise
// the broken pattern):
//   /* eslint-disable clinic-saas/require-inject */

/**
 * Set of NestJS parameter decorators that are resolved by the framework's
 * router from the incoming HTTP request — NOT by the DI container. A
 * constructor parameter decorated with one of these does NOT need
 * `@Inject(Token)`.
 *
 * Source: https://docs.nestjs.com/controllers#request-objects
 */
const REQUEST_SCOPED_DECORATORS = new Set([
  'Req',
  'Request',
  'Res',
  'Response',
  'Body',
  'Query',
  'Param',
  'Headers',
  'Header',
  'Session',
  'HostParam',
  'Ip',
  'UploadedFile',
  'UploadedFiles',
]);

/**
 * Extract the identifier name from a decorator's expression.
 *
 * Handles both forms:
 *   - `@Inject(Token)` — Decorator.expression is a CallExpression,
 *     callee is an Identifier.
 *   - `@Injectable` (bare) — Decorator.expression is an Identifier.
 *
 * @param {import('eslint').Rule.Node} decorator — the Decorator node.
 * @returns {string|null} — the decorator's identifier name, or null
 *   if the expression doesn't match either form (e.g. `@(foo || bar)`).
 */
function getDecoratorName(decorator) {
  const expr = decorator.expression;
  if (!expr) return null;

  // @Foo(...)
  if (expr.type === 'CallExpression' && expr.callee?.type === 'Identifier') {
    return expr.callee.name;
  }
  // @Foo (bare, no call)
  if (expr.type === 'Identifier') {
    return expr.name;
  }
  return null;
}

/**
 * Normalize a constructor parameter node into a common shape.
 *
 * The parameter node's structure varies based on the parameter form:
 *
 *   1. `private readonly foo: Foo` — `TSParameterProperty` wrapping an
 *      `Identifier`. Decorators live on the TSParameterProperty.
 *      Type annotation lives on the inner Identifier.
 *
 *   2. `foo: Foo` — `Identifier` directly. Decorators and type
 *      annotation both live on the Identifier.
 *
 *   3. `foo = defaultVal: Foo` — `AssignmentPattern` whose `.left` is
 *      an Identifier. Decorators live on the AssignmentPattern
 *      (and/or on the left Identifier, depending on TS version).
 *      Type annotation lives on `.left.typeAnnotation`.
 *
 *   4. `...args: Foo[]` — `RestElement`. No decorators (rest params
 *      can't be decorated in TS). Type annotation lives on the
 *      RestElement.
 *
 *   5. typescript-eslint v8 also sometimes wraps parameters in a
 *      `FormalParameter` node per ESTree spec alignment (this happens
 *      when decorators are present on a non-parameter-property
 *      constructor argument). Handle that for forward-compat —
 *      decorators live on the FormalParameter, the actual parameter
 *      is in `.parameter`.
 *
 * @param {import('eslint').Rule.Node} param — the parameter node.
 * @returns {{
 *   decorators: import('eslint').Rule.Node[],
 *   typeAnnotation: import('eslint').Rule.Node|null,
 *   paramName: string
 * }}
 */
function normalizeParam(param) {
  /** @type {import('eslint').Rule.Node[]} */
  let decorators = [];
  /** @type {import('eslint').Rule.Node|null} */
  let typeAnnotation = null;
  /** @type {string} */
  let paramName = '?';

  const unwrap = (ident) => {
    if (!ident) return;
    if (ident.type === 'Identifier') {
      paramName = ident.name;
      typeAnnotation = ident.typeAnnotation ?? null;
      decorators = [...decorators, ...(ident.decorators ?? [])];
    } else if (ident.type === 'AssignmentPattern') {
      if (ident.left?.type === 'Identifier') paramName = ident.left.name;
      typeAnnotation = ident.left?.typeAnnotation ?? null;
      decorators = [...decorators, ...(ident.left?.decorators ?? [])];
    } else if (ident.type === 'RestElement') {
      typeAnnotation = ident.typeAnnotation ?? null;
    }
  };

  if (param.type === 'FormalParameter') {
    // typescript-eslint v8 wrapper.
    decorators = [...(param.decorators ?? [])];
    unwrap(param.parameter);
  } else if (param.type === 'TSParameterProperty') {
    decorators = [...(param.decorators ?? [])];
    unwrap(param.parameter);
  } else if (param.type === 'Identifier') {
    unwrap(param);
  } else if (param.type === 'AssignmentPattern') {
    decorators = [...(param.decorators ?? [])];
    unwrap(param);
  } else if (param.type === 'RestElement') {
    unwrap(param);
  } else {
    // Unknown shape — bail (no type annotation detected).
  }

  return { decorators, typeAnnotation, paramName };
}

/**
 * Check whether a class node has at least one class-level decorator.
 *
 * This is the filter that prevents the rule from firing on plain
 * (non-NestJS-managed) classes such as test mocks, DTOs, and value
 * objects. Every NestJS-managed class has a class-level decorator
 * (`@Controller`, `@Injectable`, `@Catch`, `@Module`,
 * `@WebSocketGateway`).
 *
 * @param {import('eslint').Rule.Node} classNode — the ClassDeclaration / ClassExpression.
 * @returns {boolean}
 */
function hasClassLevelDecorator(classNode) {
  const decorators = classNode.decorators ?? [];
  return decorators.length > 0;
}

/** @type {Record<string, import('eslint').Rule.RuleModule>} */
const rules = {
  'require-inject': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'Require explicit @Inject(Token) on constructor-injected NestJS providers (ADR-013).',
        url: 'https://github.com/Thika-Management-Dz/clinic-saas/blob/main/docs/adr/ADR-013-explicit-inject-decorators.md',
      },
      schema: [],
      messages: {
        missingInject:
          'ADR-013: constructor parameter "{{paramName}}" has a type annotation but no @Inject(Token) decorator. Implicit injection is undefined at runtime under tsx/esbuild (no emitDecoratorMetadata). Either add @Inject(Token), or — if this is a request-scoped value — use the appropriate NestJS parameter decorator (@Req, @Body, @Query, etc.).',
      },
    },
    create(context) {
      return {
        // ClassDeclaration and ClassExpression both have a `body` whose
        // `body` array contains MethodDefinition nodes. We hook the
        // MethodDefinition directly to catch both class forms.
        MethodDefinition(node) {
          // Only check constructors.
          if (node.kind !== 'constructor') return;

          // Skip if the enclosing class has no class-level decorator.
          // (We can't reach the ClassDeclaration from here directly —
          // eslint provides node.parent which is the ClassBody, whose
          // parent is the ClassDeclaration/ClassExpression.)
          const classBody = node.parent;
          const classNode = classBody?.parent;
          if (!classNode) return;
          if (!hasClassLevelDecorator(classNode)) return;

          const params = node.value?.params ?? [];
          for (const param of params) {
            const { decorators, typeAnnotation, paramName } =
              normalizeParam(param);
            // No type annotation — can't infer a DI token, so the rule
            // doesn't apply. (Untyped params are a separate concern that
            // tseslint's no-explicit-any / strict config already covers.)
            if (!typeAnnotation) continue;

            // Already has @Inject(Token) — pass.
            const hasInject = decorators.some(
              (d) => getDecoratorName(d) === 'Inject',
            );
            if (hasInject) continue;

            // Has a request-scoped parameter decorator — pass.
            // (e.g. @Req, @Body, @Query — resolved by the router, not DI.)
            const hasRequestScoped = decorators.some((d) => {
              const name = getDecoratorName(d);
              return name !== null && REQUEST_SCOPED_DECORATORS.has(name);
            });
            if (hasRequestScoped) continue;

            context.report({
              node: param,
              messageId: 'missingInject',
              data: { paramName },
            });
          }
        },
      };
    },
  },
};

/** The ESLint plugin object. Registered under the `clinic-saas` namespace. */
export const clinicSaaSPlugin = {
  meta: {
    name: '@clinic-saas/eslint-config/plugin',
    version: '0.0.0',
  },
  rules,
};

export default clinicSaaSPlugin;
