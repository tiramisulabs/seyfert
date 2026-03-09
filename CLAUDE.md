# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Seyfert

A TypeScript Discord bot framework focused on low RAM usage, type safety, and full coverage of the Discord API. Published as the `seyfert` npm package.

## Commands

```bash
npm run build        # tsc --outDir ./lib
npm run lint         # biome lint --write ./src
npm run format       # biome format --write ./src
npm run check        # biome check --write ./src (lint + format)
npm test             # vitest run --config ./tests/vitest.config.mts ./tests/
# Run a single test:
npx vitest run --config ./tests/vitest.config.mts ./tests/<name>.test.mts
```

Tests live in `tests/` with `.test.mts` extension. `fileParallelism` and `isolate` are both disabled in the vitest config.

## Code Style

- Biome v2 (formatter + linter). Tab indentation, 120-char line width, CRLF line endings, single quotes, always semicolons.
- TypeScript is very strict: `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, decorators enabled.
- Compiled output goes to `lib/` (excluded from TS source).

## Architecture

```
src/
  api/          REST API client, rate limiting, endpoint definitions
  builders/     Fluent builders for commands, embeds, components
  cache/        In-memory cache layer for Discord entities
  client/       Main Client class — entry point for bot authors
  commands/     Command handler, option parsing, interaction routing
  common/       Logger, Formatter, shared utilities
  components/   Button, select menu, modal component handlers
  events/       Gateway event types and dispatch
  langs/        i18n / localization system
  structures/   Discord entity classes (User, Guild, Message, Channel, …)
  websocket/    Gateway: ShardManager, WorkerManager, shard lifecycle
  collection.ts Custom Collection and LimitedCollection (Map wrappers)
  index.ts      Single public export barrel
```

**Data flow:** `Client` connects via `websocket/` (ShardManager → WorkerManager), receives gateway events dispatched through `events/`, which hydrate `structures/` objects stored in `cache/`. Incoming interactions are routed by `commands/` and `components/` handlers. All HTTP calls go through `api/`.

**SeyfertError** is a typed error class with machine-readable codes (e.g. `INVALID_EMOJI`, `MISSING_COMPONENT`) and structured metadata — prefer it over generic `Error` when throwing framework-level errors.

## Commit Message Rules

Uses [`@commitlint/config-conventional`](https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional).

Format: `type(scope): description` — lowercase, imperative, no trailing period, header ≤ 100 chars.

Types: `feat` `fix` `chore` `refactor` `build` `ci` `docs` `perf` `test` `revert` `style`

Breaking changes: append `!` → `feat(guild)!: change return type of joinedAt`

Common scopes observed: `api` `guild` `threads` `forums` `components` `write` `camelize`

PR numbers (`(#123)`) are appended automatically by GitHub — do not add them manually.
