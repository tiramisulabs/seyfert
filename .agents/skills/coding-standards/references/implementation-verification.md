# Implementation Verification

Verify in proportion to the behavior, risk, and available repository harness.

## Establish evidence

1. Reproduce the defect or record the relevant baseline before editing when feasible.
2. Define the expected observable behavior and the invariants that must not regress.
3. Prefer a focused test or reproduction that fails for the intended reason before the fix.
4. Avoid changing production code and its test oracle from the same unsupported assumption; confirm the contract from callers, configuration, or an independent surface.
5. When the change replaces or rewrites existing code, inventory the invariants the replaced code enforces — every validation, guard, fence, and bound is one — and place each in the replacement or record its conscious retirement with the behavior change that retires it. A rewrite inherits every defect fix the replaced code carried.

## Decide whether a test earns its place

Judge each candidate test by the wrong implementation it rejects while the change is present. Name that wrong implementation before writing the test. If the only implementation the test rejects is one where the change is missing or its literal differs, the test confirms the edit instead of verifying behavior. Do not write it. Reverting the change fails every such test, so "it failed when I removed the code" proves nothing.

Confirmation tests take recognizable shapes:

- asserting the literal the change added: a label, message, constant, enum member, or map entry;
- asserting that a value passed in arrives unchanged on the other side: an option forwarded, a field copied, an argument relayed, a re-export resolving;
- asserting that something exists, is defined, is a function, or has a type;
- asserting a default or an absent value when an existing test already exercises it.

A unit keeps the one test that proves its primary effect — the write, call, or reply the unit exists to produce — even when that effect is a single assignment. Every further test on the unit must name a wrong implementation as above; a second input value, a second literal, or a value relayed alongside the primary effect does not.

Write a test when the change introduces or alters branching or transformation logic, a boundary, error, or ordering path, a contract other code depends on, a fixed defect worth a regression guard, or concurrency and lifecycle ordering. Test the branch and the boundary, not the fact that the feature landed.

Do not write a test for pass-through, glue, wiring, or re-exports; constant or string rendering; configuration; a type-only change — the typechecker is its oracle, and a runtime or `expectTypeOf` assertion restating the declaration adds nothing; code the change did not touch; or a failure mode the package's purpose excludes.

Importing a trivial value through a barrel or public entry point does not upgrade its test: a test whose only assertion is a literal stays a literal assertion regardless of the import path. Cover re-exports through the tests of behavior that already earns them. One test per behavior, not per line, and no new harness for code the existing oracles already prove.

Reasons that do not earn a confirmation test:

| Reason offered | Why it fails |
|---|---|
| "The typechecker is not an oracle for this wiring" | A forwarded option that is not forwarded is visible in the diff; the full-diff self-review is its oracle. The test rejects no implementation that has the forwarding line. |
| "It mirrors the existing test convention" | Existing tests earn their place on their own behavior — a default, a branch. Matching their shape does not transfer their reason. |
| "I mutated the implementation and the test failed" | Deleting the change fails every confirmation test. The mutation that counts is a wrong version of the change with the change present. |
| "The type catches a missing entry but not a wrong string" | The only wrong string is a different literal. Asserting the literal is the definition of a confirmation test. |
| "A real consumer depends on it" | Dependence makes the field part of the contract; it does not make relaying it logic. Cover it where the consumer's behavior branches on it. |
| "It is cheap and adds coverage" | Coverage of a line with no branch is a maintenance obligation with no defect behind it. |

## Select checks

- Select checks that exercise the changed contract and satisfy repository requirements. Broaden them for affected integration boundaries, meaningful risk, or unresolved failures; passing focused checks do not automatically require a larger suite.
- Use compiler or declaration fixtures for public type changes and runtime tests for runtime behavior; use both when both surfaces change.
- Exercise duplicate, stale, out-of-order, retry, partial-failure, and teardown paths for concurrent or lifecycle code.
- Verify generated artifacts only through the repository's approved generation flow. Do not hand-edit generated output unless explicitly required.
- Use build, typecheck, runtime reproduction, or end-to-end checks when no functioning test harness exists. Do not introduce a test framework automatically.
- Inspect commands for writes, autofix, generation, staging, commits, publication, network effects, or live-system access before running them. Choose a non-mutating equivalent when verification should be read-only.

## Prove cross-boundary integration

When responsibility, dependencies, or behavior cross package, runtime, build, CI, release, deployment, or presentation boundaries, verify each affected contract independently:

- Inspect emitted runtime artifacts, declarations, package entry points, and module format when compiler or package ownership changes. Build success alone does not prove that consumers receive the intended artifact.
- Prove the relevant test is selected by the effective CI workflow. A local passing test does not prove CI coverage.
- Trace release and deployment triggers, path filters, package selectors, exclusions, build inputs, and affected consumers. A valid workspace link does not prove that a consumer rebuilds or deploys when its dependency changes.
- Inspect resolved lockfile entries after dependency changes for duplicate or conflicting versions of runtimes, compilers, plugins, and other coupled toolchains. Successful installation does not prove dependency-graph economy or compatibility.
- Complete the representation-parity audit in [quality-review.md](quality-review.md) when the same facts cross presentation or serialization surfaces.

Treat passing install, build, typecheck, test, and workflow commands as necessary evidence for the contracts they exercise, not substitutes for unexamined boundaries.

## Classify results

Classify every relevant failure as one of:

- `new failure`: introduced by the current patch;
- `pre-existing failure`: reproduced without the patch or outside its changed surface;
- `tooling defect`: the check cannot measure its claimed contract reliably;
- `not available`: the required environment, dependency, credential, or harness is absent.

Fix new failures within scope. Do not repair unrelated baseline defects without authority. Disclose tooling defects and unavailable checks precisely.

## Self-review the patch

- Inspect the full diff plus complete relevant untracked files; do not rely on a summary alone.
- Trace changed inputs and outputs through callers and consumers.
- Check failure, retry, cancellation, duplicate-event, cleanup, and compatibility paths where applicable.
- Remove debug artifacts, speculative helpers, dead branches, accidental formatting, and unrelated changes.
- Review the diff against the quality dimensions in [quality-review.md](quality-review.md): duplication and divergent same-name helpers, naming, type altitude, comment discipline, consistency with neighboring code.
- Audit the diff against [implementation-economy.md](implementation-economy.md): every mechanism carries its stated demand, every export has a non-test consumer, one name per behavior, no re-derived workspace or platform utility.
- Confirm each changed file belongs to the requested scope and that no user work was overwritten.
- Complete every applicable ownership-transfer and representation-parity audit. If required evidence is unavailable, report that limitation instead of claiming the boundary is verified.
- Rerun affected checks after corrective edits. Once relevant evidence is sufficient and required checks pass, stop; repeat or broaden checks only for new changes, failures, or unresolved concerns.

Report commands and results accurately. State what was not run and why. Do not equate a build, typecheck, or formatter pass with behavioral coverage it does not provide.
