# Evidence Playbook

Use the sections relevant to the task. Do not emit a gate table unless the user asks for one.

## Bugs

1. Reproduce the user's exact failure or trace the exact runtime decision path.
2. Separate observed facts from hypotheses.
3. Locate the first layer where actual behavior diverges from the contract.
4. Change that layer with the smallest coherent patch.
5. Re-run the exact reproduction, then adjacent tests and consumers.

Tests support a reproduction; they do not replace it when the reported failure is UI, integration, live data, or environment-specific.

## Shared and Public Contracts

Search for every definition, export, wrapper, implementation, and direct consumer of a changed symbol. Review generated declarations or documentation when they are part of the effective API. Prefer a core fix when the contract is wrong at the core; do not hide it behind a consumer workaround.

Validate types with the real compiler and exercise at least one runtime path when compile-time and runtime contracts can diverge.

## Exhaustive Changes

Use the narrowest query that covers the canonical set, then broaden it with related spellings, aliases, generated surfaces, and registrations. Record the initial count locally. After editing, repeat equivalent queries and reconcile every original member.

For large sets, report totals and exceptions rather than flooding the user with routine entries. Never hide exclusions.

## Reviews and Automated Findings

For each finding:

1. Inspect the current code and review-thread state.
2. Reproduce or prove the claimed failure.
3. Apply it only if still valid and in scope.
4. Delete genuinely unnecessary scaffolding instead of inventing usage to satisfy a reviewer.
5. Re-run the verification that demonstrates the real contract, not merely comment closure.

## Unfamiliar or Changing Interfaces

Prefer current primary evidence in this order:

1. installed source and types for the exact version;
2. built-in `--help`, schema, or command inspection;
3. official documentation for the exact version;
4. existing working integration in the repository.

Browse when the contract is unstable or not available locally. Do not invent signatures, endpoints, flags, defaults, or model capabilities from memory.

## Verification Ladder

Choose the smallest set that proves the outcome, then widen when blast radius demands it. For bug work, run the exact reproduction after targeted changed-surface checks and before broader package or integration verification; the remaining order is risk-based rather than rigid:

1. syntax, formatting, or static inspection of changed files;
2. targeted typecheck, unit test, or command smoke;
3. exact user reproduction when a bug was reported;
4. affected package test and build;
5. direct callers and integration path;
6. wider workspace, cross-package, or cross-repository verification.

If a wider command fails for an unrelated pre-existing reason, prove that separation with focused evidence and report it rather than hiding or fixing unrelated code.

## Final Diff Review

Read the full final diff from top to bottom. Confirm:

- each file is necessary for the request;
- no user work was overwritten;
- no speculative helper, dead compatibility layer, placeholder, debug output, credential, or destructive command remains;
- comments and documentation describe the effective behavior;
- tests assert behavior rather than implementation trivia.
