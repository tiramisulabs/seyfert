# Seyfert test and verification guidance

Read the repository-root `AGENTS.md` first. For tests covering `src/**`, also
read `src/AGENTS.md` and every owning subsystem guide routed by the root table.
This guide owns test selection, compiler contracts, verification commands,
portability checks, and test-file style.

## Test ownership

Use the closest existing test first.

| Contract | Primary tests |
| --- | --- |
| Root exports and declaration cycles | `root-export-contract.ts`, `public-entrypoint-cycles.test.mts` |
| Client lifecycle, config, and collectors | `invalid-token.test.mts`, `config-load.test.mts`, `client-collectors.test.mts` |
| Plugin authoring and extensions | `plugin-authoring-contract.ts`, `plugins.test.mts`, `plugin-api.test.mts`, `client-plugins.test.mts` |
| Registry/client inference | `command-context-client-type.test.mts` and the compile-time contracts |
| Command declarations/options/subcommands/locales | `command-declare-*`, `command-options-contract.ts`, `command-subcommands-limit.test.mts`, `command-locales.test.mts` |
| Command/component/modal contexts | `command-context-modal.test.mts`, `component-*.test.mts`, `modal-context-update.test.mts`, `interaction-reply.test.mts` |
| REST/retries/uploads/shorters | `rest-retry-options.test.mts`, `interaction-request.test.mts`, `message-shorter.test.mts`, attachment/message tests |
| Cache and structures | `cache.test.mts`, channel/guild/member/role/voice-state tests |
| Gateway and workers | `gateway-send.test.mts`, `gateway-reconnect.test.mts`, `workermanager.test.mts` |
| Builders and errors | `builder-validation.test.mts`, feature builder tests, `seyfert-error.test.mts` |
| Langs and locale selection | `langs-handler.test.mts`, `context-lang-preference.test.mts`, `command-locales.test.mts` |
| Shared foundations | `collection.test.mts`, `mixer.test.mts`, `bitfield.test.mts`, `common-utils.test.mts`, `logger.test.mts`, `formatter.test.mts` |

Compile-time contract files are real tests even though they do not use Vitest.
`tests/tsconfig.json` maps `seyfert` to the freshly built `lib/index.d.ts`, so
type verification checks the consumer-facing declaration surface.

For a new regression:

- prefer adding it to the owning file rather than creating a broad
  miscellaneous suite;
- reproduce the public failure, not an implementation detail;
- use a temporary consumer project and the TypeScript compiler API when normal
  `tsc` diagnostics cannot reproduce editor/lazy-resolution behavior;
- keep fixtures minimal and clean them up in `finally` blocks;
- test adjacent shared contexts when the changed alias or handler feeds more
  than one surface.

## Commands

The repository pins `pnpm@11.10.0`. CI uses Node 22 and runs the suite under
Node, Bun, and Deno.

```sh
# Reproduce the Node dependency graph used by CI
pnpm install --frozen-lockfile

# Build JS and declarations
pnpm run build

# Build, then type-check all test contracts
pnpm run test:types

# Target the strict public authoring contracts
./node_modules/.bin/tsc --noEmit --project tests/plugin-authoring-tsconfig.json

# Run one Vitest file
./node_modules/.bin/vitest run --config ./tests/vitest.config.mts ./tests/<name>.test.mts

# Full build + type contracts + runtime tests
pnpm test

# Read-only production-source check
./node_modules/.bin/biome check --no-errors-on-unmatched ./src
```

When a portability change requires local Bun/Deno parity, mirror
`.github/workflows/check.yml`:

```sh
# Bun
HUSKY=0 bun install --ignore-scripts
bun run build
bun --bun ./node_modules/vitest/vitest.mjs run --config ./tests/vitest.config.mts ./tests/

# Deno
HUSKY=0 deno install
deno run -A npm:typescript/tsc --outDir ./lib
deno run -A npm:vitest run --config ./tests/vitest.config.mts ./tests/
```

## Verification ladder

Use the ladder proportionally:

1. Inspect/format the changed file.
2. Run the targeted compiler contract or Vitest regression.
3. Build declarations for public/type changes.
4. Run `pnpm test` for shared/public/runtime changes.
5. Run the relevant Bun/Deno path when changing portability, workers,
   filesystem behavior, Web APIs, or transport code.
6. Run a real gateway smoke only when the task requires it and a token is
   explicitly available.

`tests/vitest.config.mts` disables file parallelism and isolation, so tests may
share module state. Preserve cleanup and avoid tests that depend on accidental
execution order. Gateway/custom-event collectors in `src/client/collectors.ts`
and component collectors in `ComponentHandler` are separate systems; test the
one owned by the changed path.

The repository scripts `check`, `check-h`, `lint`, and `format` all use
`--write`; they mutate source. Use the direct Biome command above when only a
read-only check is intended.

## Test code style

Runtime tests are `*.test.mts`; compiler contracts are `.ts` files loaded by a
test tsconfig. Import according to the subject:

- `../src/...` for an internal runtime unit;
- `../lib/...` when emitted output is the subject;
- `seyfert` through test path mapping for the consumer-facing public contract.

Do not normalize import sources. The dominant Vitest vocabulary is `describe`,
`test`, `expect`, and `vi`; preserve other local styles. With isolation/file
parallelism disabled, restore spies/mocks/globals, real timers (preferably in
`finally`/`afterEach`), and singleton/module state; remove temporary directories
in `finally`; never depend on test order. Name regressions after observable
guarantees, use small setup helpers when clearer, and cover accepted plus
explained negative forms when both define a contract.
