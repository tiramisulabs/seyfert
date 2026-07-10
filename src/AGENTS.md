# Source-wide Seyfert guidance

Read the repository-root `AGENTS.md` first. This guide applies to every path
under `src/`; read the owning subsystem guide listed by the root router before
changing a deeper path. The closest nested guide owns subsystem runtime facts;
this guide owns shared public API, TypeScript, style, and compatibility rules.

## Public API and type-system rules

- The supported public surface is the root `seyfert` entrypoint. Export a new
  public symbol through its feature barrel and `src/index.ts`; verify whether it
  is a runtime value, a type-only export, or both.
- Avoid new deep imports. A deep path is acceptable only when it is an
  intentionally supported existing contract, such as the current custom
  prefix-handler path.
- `tsconfig.json` uses strict checking, declarations, `stripInternal`, unused
  checks, and decorator metadata. An `@internal` annotation changes emitted
  declarations; verify the built `.d.ts` when touching visibility.
- Augment `SeyfertRegistry` for registered client, middleware, langs, or plugin
  types. `UsingClient`, `DefaultLocale`, and registered middleware types are
  derived aliases and are not augmentation targets.
- `ParseClient` preserves the selected client across registry inference. A
  change around it can affect commands, components, modals, menus, entry
  points, and interaction responses, including lazy/editor resolution before
  diagnostics run.
- Preserve readonly inputs, overload inference, type guards, and declaration
  merging. Do not replace a precise public type with `any` or a broad cast to
  make a local compiler error disappear.
- When runtime and type behavior can diverge, add both a compile-time assertion
  and a runtime test. Follow `../tests/AGENTS.md` for those proofs.

## Errors and validation

Framework validation/runtime errors use `SeyfertError` from
`src/common/it/error.ts`.

- Reuse an existing stable error code when semantics match; otherwise add a
  specific code/message and test it.
- Preserve the original `cause` when wrapping lower-level failures.
- Validation metadata should use `createValidationMetadata()` so `expected`,
  `received`, and `receivedType` remain consistent. Add domain context as extra
  metadata fields.
- Plugin lifecycle failures follow `client/AGENTS.md`: use the plugin error
  wrappers/aggregate error, not a generic `SeyfertError` replacement.
- Test the code, metadata, cause, and user-observable control path that matter.

## Formatting authority

`biome.json` governs `src/**`: tabs (width 2), single quotes, semicolons,
120-character lines, CRLF, arrow parentheses only when needed, and organized
imports. Recommended rules are disabled; the only error-level lint rule is
`useImportType`. Do not attribute other recommended rules to this repository.

`.editorconfig` has similar basics, but Biome excludes `tests/**`, Markdown,
workflows, and repository configuration. Match those files locally and use
their owning tool; a green source check does not cover them.

```sh
# Format only intentionally changed production files
./node_modules/.bin/biome check --write ./src/path/to/changed-file.ts
# Read-only production-source verification
./node_modules/.bin/biome check --no-errors-on-unmatched ./src
```

`check`, `check-h`, `lint`, and `format` all write. The pre-commit hook runs an
unscoped `biome check --write`; after an authorized commit attempt, re-read the
complete diff for spillover. CI may commit `chore: apply formatting`; format and
inspect locally instead of relying on CI repair.

## Imports and exports

- Use `node:` specifiers for Node built-ins.
- Use extensionless `src/` relatives; emission is CommonJS with Node resolution.
- Use `import type` for wholly type-only imports and inline `type` for mixed
  imports; let Biome organize ordering.
- Use the established feature barrel for public features and direct modules for
  implementation-only symbols. Do not reorganize unrelated imports.
- Library source uses named exports, but default exports remain valid for
  command/event/component/lang file loading and config/tests; do not ban them.
- New public symbols normally need implementation, feature-barrel, and
  `src/index.ts` exports. Run root-export/declaration-cycle contracts when root
  exports or internal barrel dependencies change.
- Internal test reachability does not justify a deep public import; verify the
  root `seyfert` entrypoint separately.

## Naming and file placement

- Match the owning directory: public structures/builders usually use PascalCase;
  handlers, adapters, shorters, routes, and types use local lower/camel/domain
  conventions. Historical names (`entryPoint.ts`, `voiceStates.ts`,
  `SharedTypes.ts`, `webhokEvents.ts`) are compatibility, not rename targets.
- Do not rename files/public identifiers merely to normalize casing. New
  classes/interfaces/type aliases use PascalCase; ordinary functions, methods,
  fields, and locals use lowerCamelCase unless the subsystem says otherwise.
- Gateway hooks use Discord `UPPER_SNAKE_CASE`; decorator factories (`Declare`,
  `Options`, `Middlewares`) are PascalCase; preserve public helper spelling.
  Constants follow neighbors. Prefix required unused parameters with `_`.
  Existing `__filePath`-style contracts do not license new `__` private names.
- Place code where its invariant is owned. Do not extract a generic utility for
  one small expression or move framework-specific code to `common/` until shared.

## TypeScript and declarations

Strict checks include unused symbols, implicit returns, fallthrough,
nullability, variance, decorator metadata, declarations, and `stripInternal`.

- Keep public input collections `readonly` for tuples/`as const`; preserve
  literals with readonly tuples, const type parameters, `as const`, and
  `satisfies` where appropriate.
- Prefer `unknown` for errors/untrusted data. `any` is allowed at dynamic
  boundaries, but never widen a precise public contract to silence errors;
  keep unavoidable casts local.
- Use `satisfies` to validate without widening, especially for worker/gateway
  messages, plugin contributions, and request options.
- Preserve declaration-merging/augmentation interfaces. Do not swap
  `interface` and `type` stylistically; use aliases for unions,
  conditional/mapped types, and where locally established.
- Add a named return type when declarations, registry augmentation,
  circular/lazy inference, overloads, or public readability need one.
- Preserve overloads, brands, conditional types, `this` returns, and type
  guards; judge emitted declarations and consumer contracts too.
- Non-null assertions and narrow casts require a real invariant; do not change
  them mechanically.
- `@internal` affects emitted declarations; `@deprecated` is public. Build and
  inspect relevant `.d.ts` files after changing either.
- Use `declare` for type-only class refinements that must not initialize at
  runtime, following nearby client/builder patterns.

## Shared class and wire conventions

- Builders mutate `data`, return `this`, and serialize with `toJSON()`.
  Validate where neighboring builders do and throw typed `SeyfertError`s.
- Received components (`src/components/`) and outbound builders
  (`src/builders/`) are different models. Update both only when the public
  contract requires it; the components guide owns received-component behavior.
- REST/gateway types keep Discord wire names; transformed camel-case data
  belongs in `Transformers` and structures.

Subsystem-specific idioms for shorters, cache resources, structures, and
plugins live only in their nested guides.

## Control flow and async behavior

Preserve the semantics of existing `async`/`await`, promise chains, sequential
loops, `Promise.all`/`allSettled`, and explicit fire-and-forget paths.

- Keep `Awaitable<T>` callbacks sync-or-async; do not narrow them to
  `Promise<T>`/`void` without a public decision.
- Preserve ordering and rejection behavior across plugin interceptors,
  lifecycle hooks, event transforms, cache writes, collectors, and error hooks.
- Add `async` only to await work or intentionally return rejection.
- Preserve intentional un-awaited handling. New rejectable work needs an
  explicit rejection path, not an accidental floating promise.
- Swallow errors only at intentional fallback/isolation boundaries; otherwise
  propagate, preserve `cause`, or route through the owning logger/error hook.
- Biome does not require braces, `for...of`, default switch clauses, or one
  function style; match neighbors and keep control flow clear.

## Logging and diagnostics

- Use the owning logger for operations and `client.debugger` for opt-in detail.
- Include available plugin/event/shard/command/custom-id/file identity.
- Preserve plugin attribution through the plugin diagnostic/error wrappers.
- Do not add `console.*` where a logger exists; low-level/bootstrap/docs
  examples are exceptions, not a general pattern.

## Comments, JSDoc, and suppressions

- Document new public classes, methods, types, deprecations, and non-obvious
  behavior; examples use current root imports.
- Internal comments explain ordering, concurrency, declaration emission,
  protocol quirks, or compatibility—not obvious code.
- New `@ts-expect-error` directives explain their invariant/rejection. Prefer
  them to `@ts-ignore`; do not copy unexplained historical suppressions.
- Compiler negative cases must precisely explain why the form is rejected.
- Do not substitute TODOs for in-scope behavior/tests or do incidental
  comment/spelling cleanup outside the changed contract.

## Compatibility

- Preserve Node/Bun/Deno; reuse lazy/conditional environment loading and verify
  affected runtimes.
- Keep optional filesystem behavior out of serverless/Cloudflare-only paths.
- Preserve exact Discord wire names and established public spelling.
- Match local patterns before abstractions; avoid speculative compatibility,
  unrelated cleanup, and formatting churn.

## Do not standardize these globally

Do not globally require `interface` versus `type`; ban `any`, casts, non-null
assertions, or default exports; require all return types; rewrite promise style;
require declarations versus arrows; add braces/default switch clauses; impose
one casing or test-import source; mass-format; or rename public symbols as
incidental cleanup.
