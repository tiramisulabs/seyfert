# Repository Adaptation

Infer local practice from current tracked evidence; never transplant a convention from another repository.

## Establish relevant repository evidence

Read applicable repository instructions and inspect worktree state before editing so unrelated work is preserved. Use affected source, callers, tests, and public declarations to resolve the change's actual contracts.

Inspect toolchain configuration, generated boundaries, build graphs, CI, or hooks when the change or selected check depends on them. Reuse facts already established in the session; broaden inspection when evidence conflicts or responsibility crosses a boundary. Inspect unfamiliar package scripts before running them: names such as `check`, `lint`, and `test` do not establish their effects or coverage.

## Resolve conflicting evidence

Apply the authority order in `SKILL.md`. Prefer the safe intersection when tracked prose and effective tooling disagree. Treat recurring source patterns as evidence only when they are current, coherent, and not generated or dirty.

Do not perform a repository-wide migration to reconcile a local contradiction unless the user requests it. Report material contradictions that affect the requested change.

## Preserve local boundaries

- Use the repository's existing architectural owner for a responsibility.
- Match public export, dependency, generated-output, and test-fixture conventions.
- Keep dependency metadata and the declared lockfile synchronized when dependency changes are authorized.
- Avoid adding a framework, helper layer, or test harness that the repository does not use merely to express a personal preference.
- Preserve supported runtime and compiler matrices. Verify public/type changes against the consumers those matrices represent.

## Audit responsibility transfers

Apply this audit when source, tests, schemas, configuration, generated output, or runtime responsibility moves to a different module, package, service, or deployment unit. Inventory what the previous owner supplied: runtime entry points, public exports and declarations, compiler and build settings, tests and fixtures, generated artifacts, dependency metadata, CI selection, release or deployment triggers, and direct consumers. Account for each invariant at the new owner or record its intentional retirement as part of the accepted behavior.

Inspect the effective module format and emitted artifacts, not only source imports. Trace every direct consumer through workspace dependencies and build order. Read workflow path filters, package selectors, exclusions, and deployment inputs in both directions: prove the new owner is included when it changes, and that unrelated broad triggers did not accidentally remain. Keep the resolved dependency graph coherent; a syntactically valid lockfile does not rule out duplicate or conflicting toolchain and runtime resolutions.

Do not infer a complete transfer from a successful local build, linked workspace import, or focused test. Those checks prove only their own surface.

## Handle dirty state

Record pre-existing changes before editing. Do not format, revert, stage, or include unrelated work. Continue around non-overlapping changes; stop and request direction when the requested edit would overwrite or make ownership of overlapping work ambiguous.
