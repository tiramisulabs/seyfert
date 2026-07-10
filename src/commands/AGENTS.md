# Commands and interactions subsystem

Read the repository-root and `src/AGENTS.md` guides first. This guide owns
command declarations, options, contexts, loading, subcommands, application
interactions, and prefix handling. For cross-cutting work, follow the root
routing table for every affected path and verification step.

## Ownership and flow

- Command declarations and runtime execution are split across
  `src/commands/decorators.ts`, `handler.ts`, `handle.ts`, `optionresolver.ts`,
  and `applications/**`.
- `CommandHandler` owns file loading, reloads, subcommand defaults, upload
  shapes, and programmatic registration.
- `HandleCommand` owns incoming interaction and prefix-message dispatch.
- `applications/shared.ts` is a critical public type hub: `UsingClient`,
  `ParseClient`, middleware metadata, registry-derived types, internal options,
  custom structures, and channel option mappings live there.
- Middleware flow is `next()` or `stop()`. `stop()`/`stop(null)` is a silent
  skip; `stop(reason)` is a middleware denial; thrown/rejected errors go to the
  internal-error path.
- `@AutoLoad()` scans the parent command directory recursively. Keep helpers
  outside an auto-loaded subcommand tree and preserve inherited parent
  defaults/middlewares when changing subcommand resolution.

Changes here often affect command, component, modal, menu, entry-point, and
interaction-response contexts through shared aliases. Verify adjacent contexts,
not only the original reproduction.
