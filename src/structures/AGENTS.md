# Structures subsystem

Read the repository-root and `src/AGENTS.md` guides first. This guide owns
public runtime structures, transformed fields, methods, type guards, mixins,
and declaration merging. For cross-cutting work, follow the root routing table
for every affected path and verification step.

- Structure fields originate in transformed Discord payloads. If a structure
  method or type guard changes, verify both the runtime predicate/method and the
  exported narrowed type.
- Declaration merging used by structures and mixins is deliberate. Preserve
  the mixins, align runtime fields with merged public interfaces, and do not
  simplify the contract based only on the apparent class declaration.
- Apply the wire-name and transformation boundary owned by `src/AGENTS.md`.
