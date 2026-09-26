---
name: coding-standards
description: Implement, fix, or refactor repository-native code, with attention to behavioral contracts, code shape, implementation economy, and meaningful verification. Use code-review-standards instead for read-only reviews of concrete changes.
---

# Coding Standards

Deliver the requested behavior with code that fits the repository, preserves supported contracts outside the requested change, and introduces only justified complexity.

## Authority and scope

Follow the user's current instructions and existing authorization, then applicable repository instructions. Use effective configuration, executable contracts, and coherent source/caller/test patterns to establish behavior. Personal defaults and stored history are hints when stronger evidence is silent; they do not override the requested outcome.

Preserve dirty user work. Distinguish an explanation or review request from an implementation request. Continue authorized implementation through relevant verification and fixes; do not stop at the first draft or ask again for an already authorized action. Committing, pushing, publishing, deploying, and destructive cleanup require explicit authority for that action.

Treat intended behavior supported by types, documentation, tests, or callers as contract. Change it when the requested outcome authorizes that change. If a material contract decision remains unresolved, ask the smallest necessary question with the conflicting evidence and continue independent work. Resolve routine implementation choices from repository evidence. When a rule actually blocks progress, identify the exact instruction and explain why existing authorization does not resolve it.

## Choose the relevant guidance

Read references when their decision applies, reusing context already established. A narrow edit does not require a repository-wide survey or every reference.

- **Code shape:** [code-shape.md](references/code-shape.md) for variables, control flow, functions, types, and abstraction boundaries.
- **Added complexity:** [implementation-economy.md](references/implementation-economy.md) when adding or reconsidering mechanisms, helpers, exports, or options.
- **Runtime contracts:** [behavioral-contracts.md](references/behavioral-contracts.md) for errors, asynchronous work, concurrency, lifecycle, and public behavior.
- **Repository conventions or ownership moves:** [repository-adaptation.md](references/repository-adaptation.md).
- **Verification:** [implementation-verification.md](references/implementation-verification.md) when selecting checks or writing tests. A new test should reject a plausible wrong implementation, not merely assert that an edit exists.
- **Self-review:** [quality-review.md](references/quality-review.md) for final correctness and quality assessment, including the representation-parity audit.

## Implementation criteria

Establish the observable outcome and relevant invariants from affected source and consumers. Make the smallest coherent root-cause change; reshape incidental structure when it obscures ownership, state, ordering, or failure semantics. Prefer repository-native constructs and existing owners over stylistic uniformity or speculative abstractions.

When responsibility crosses module, package, runtime, build, or deployment boundaries, account for the old owner's contracts with the ownership-transfer audit. When domain facts cross representations, account for semantic parity with the representation-parity audit. These are conditional correctness obligations, not optional substitutes for tests.

Implementation is complete when the requested behavior is implemented, the full patch has been reviewed, relevant checks support the changed contracts, and new failures within scope are resolved. Rerun affected checks after corrections. Broaden investigation or testing when risk, a failure, or an unresolved contract warrants it; stop once the evidence is sufficient and required checks pass. Report unavailable evidence without claiming the affected boundary is verified.

## Report

Lead with the result and the evidence needed to assess it. Identify the meaningful behavior and files changed, relevant verification, and material limitations. Separate new failures, pre-existing failures, tooling defects, and unavailable checks. Keep routine reasoning and audit worksheets out of the response unless they help explain a decision or the user requests them.
