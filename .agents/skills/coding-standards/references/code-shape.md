# Code Shape

Choose constructs for their semantics. Follow enforced repository conventions where multiple forms are equivalent.

## Variables

- Declare a binding near its first meaningful use and name it for the domain fact it holds.
- In JavaScript and TypeScript, prefer `const` unless the binding itself is reassigned. Mutating an object referenced by a binding does not require `let`. Avoid new `var` declarations unless the current repository or supported runtime requires them.
- In other languages, prefer the repository-native immutable binding when its value does not change; use reassignment when it represents a real state transition or materially simplifies the algorithm.
- Compute a value once when repeated evaluation is expensive, stateful, time-sensitive, or harder to read. Inline trivial single-use expressions when naming adds no information.
- Keep scopes narrow. Avoid shared scratch state, sentinel flags, and variables declared early only to be assigned through distant branches.
- Validate untrusted values at their boundary before narrowing them. Do not use assertions to invent facts the runtime has not established.
- Let current repository evidence override equivalent binding style, and avoid mechanical declaration churn outside the requested change.

## Loops and collections

Select the form from the operation:

- Use a sequential loop when order, early exit, `break`, `continue`, per-item `await`, or partial progress matters.
- Use an indexed loop when the index, neighboring elements, or in-place position is part of the algorithm.
- Use `map` for a consumed one-to-one transformation and `filter` for selection. Do not use either only for side effects.
- Use `reduce` when the accumulator is the clearest expression of the result; prefer an explicit loop when mutation, exits, or multiple evolving states make the reduction opaque.
- Use `forEach` only for synchronous side effects that need neither early exit nor awaited completion.
- Use `while` for state machines or unknown iteration counts, and make progress and termination explicit.
- Run work concurrently only when operations are independent, concurrency is bounded appropriately, and failure semantics are intentional. Do not replace sequential work with `Promise.all` as a style preference.

Keep an existing loop or `continue` when it expresses the control flow clearly. Explain a questioned construct before assuming it should be rewritten.

## Control flow

- Use guard clauses to isolate invalid or terminal paths when they reduce nesting.
- Judge a control-flow shape by the decisions, effects, and failure paths it carries, not by its syntax or line count. Reshape expressions, callbacks, or branch nests that obscure independent decisions or required sequencing; keep a long form when it still expresses one coherent operation clearly.
- Keep state transitions visible. Prefer a discriminated state or explicit branch over interacting booleans with invalid combinations.
- Preserve cleanup, acknowledgement, retry, and `finally` behavior when moving returns or throws.
- Make exhaustive branches explicit for closed state sets. Handle open external inputs with a validated fallback.
- Avoid conditions that mix authorization, lifecycle, and data validation without naming or separating those decisions.

## Functions

- Give each function one coherent responsibility and make side effects discoverable from its role and placement.
- Do not preserve incidental structure merely to avoid a larger-looking diff. Extract a single-use function when it names a coherent contract, separates orchestration from execution, or owns validation, state, ordering, failure, or resource lifecycle. Reuse is not a prerequisite for a justified boundary.
- Keep parameters separate when they vary independently. Group them when they form one domain input, travel together, or prevent positional mistakes.
- Return the fact the caller needs. Avoid ambiguous sentinel values when absence, failure, and success have distinct meanings.
- Keep asynchronous boundaries honest: return or await owned work, and document intentionally detached work through the repository's established mechanism.
- Split a function when the extracted unit has a stable name, contract, or ownership boundary—not solely to reduce line count.

## Types

- Derive types from authoritative schemas, public contracts, and real runtime states.
- Represent meaningful variants with discriminated unions or equivalent repository-native constructs.
- Preserve inference when it is precise and readable; add annotations at public boundaries, recursive definitions, unstable inference points, or places where they enforce intent.
- Keep compile-time and runtime validation distinct. Validate external data even when a static type describes the desired result.
- Avoid broad casts, non-null assertions, and catch-all types that erase an unresolved contract.

## Abstractions

- Introduce an abstraction for a stable domain boundary, repeated policy, ownership seam, or independently testable contract.
- Keep direct code when a helper would be indirection without clarifying a boundary; single use alone is not evidence against extraction.
- Reuse framework and repository primitives before adding wrappers that duplicate them.
- Do not generalize from one current caller without evidence that variation is required.
- Keep generated output and authored source separated according to repository policy.
