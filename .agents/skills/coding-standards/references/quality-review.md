# Correctness and Quality Review

Assess correctness, regression risk, and code quality against repository evidence. Treat intended behavior as contract rather than defect, but challenge behavior that contradicts producers, consumers, tests, types, configuration, or lifecycle guarantees.

## Scope the pass

1. Inspect the full change and complete new files; do not rely on a summary or a partial diff.
2. Read neighboring code with the same responsibility plus affected callers, consumers, tests, and public surfaces. Establish intended behavior and local conventions before judging the change.
3. Trace changed inputs and outputs through applicable success, absence, error, retry, cancellation, duplicate, ordering, cleanup, and compatibility paths.
4. Run focused non-mutating tests, reproductions, typechecks, and quality tooling when they materially test a suspected finding or reveal what the repository already enforces.

## Audit representation parity

Apply this audit when the same domain facts are mirrored, forwarded, serialized, logged, notified, or rendered across two or more surfaces. For each peer field, compare the authoritative source, semantic value, representation, escaping or encoding, and absence or fallback behavior. Use an internal matrix such as `field | source | established representation | changed representation | fallback` when it makes divergence visible; the matrix is a review aid, not required report boilerplate.

Field presence alone does not establish parity. Check whether identities remain equally interpretable, units and timezones retain their meaning, structured values remain unambiguous, and missing values degrade consistently. Treat an unexplained divergence between peer fields or surfaces as a finding when it creates an observable inconsistency or loses information. Preserve intentional differences required by a target platform or product contract, and cite the evidence for that exception.

## Correctness dimensions

- **Behavior**: the implementation contradicts an observable contract established by callers, types, tests, documentation, configuration, or neighboring runtime behavior.
- **State and ownership**: partial commits, stale references, leaked timers or listeners, double settlement, invalid transitions, or cleanup performed by a component that no longer owns the resource.
- **Errors**: swallowed or misclassified failures, lost cause or context, callbacks that strand queues, and failure paths that leave externally visible state inconsistent.
- **Ordering and concurrency**: races, stale acknowledgements, reused identities, unbounded work, or ordering assumptions enforced at the wrong layer.
- **Compatibility**: public types, exports, declarations, runtime behavior, portability, or supported inputs changed without the corresponding contract decision and coverage.
- **Regression surface**: direct callers or sibling paths sharing the changed mechanism still rely on an invariant the new code removed or bypassed.
- **Representation parity**: a mirrored or forwarded domain fact changes identity readability, units, timezone, encoding, precision, or fallback semantics on one surface without an established contract requiring the difference.

Require a concrete failure mode for every correctness finding. Trace it from an accepted input or reachable state to the violated contract. Reproduce it when practical; otherwise state the evidence and residual uncertainty. Do not report speculative possibilities excluded by the repository's environment or purpose.

## Quality dimensions

- **Duplication**: the same helper defined in several files; worse, same-name helpers with divergent semantics — a validation that accepts zero in one module and rejects it in another. Divergent twins outrank plain repetition; they are traps, not redundancy. Paired paths over one format — construct/parse, serialize/deserialize — each carrying its own spelling of the shared rule are the intra-file form: one format has one named validation that both sides call. Sibling statement blocks re-spelling one operation over enumerable pairs are the statement form: when the pairing carries a domain fact or the list is expected to grow, put the pairs in one table and loop over it.
- **Altitude**: types, parameters, or signatures wider or narrower than the facts they carry — unions inviting inputs a component never receives, no-op type operators, catch-all types papering over an unresolved contract.
- **Naming**: bindings named for their implementation instead of the domain fact they hold; one name meaning different things across modules.
- **Bindings**: a binding consumed exactly once, immediately after creation, adds a name the expression already speaks — inline it; a value used twice or more earns its binding. One expression that binds some peer values and inlines others has not chosen its shape; make the peers uniform.
- **Comments**: the only comment worth requiring states a constraint the code cannot show — a load-bearing override, an ordering requirement, an external quirk being worked around. Flag its absence there; flag narration, restated code, and change-justification comments everywhere else.
- **Structure**: dead branches, speculative helpers, decorative states or events that no consumer distinguishes, incidental structure preserved only to keep the diff looking small.
- **Consistency**: forms that diverge from the file's or repository's established pattern without a semantic reason — braced versus unbraced switch cases, competing clone idioms, mixed error-wrapping styles.
- **Boundaries**: responsibilities placed in a module that does not own them; helpers duplicating framework or repository primitives; an abstraction introduced without a stable boundary, or a missing one where validation, ownership, or policy repeats.
- **Surface economy**: exports, options, events, and configuration no consumer needs; public surface that exists because it was easy, not because it was asked for.
- **Noise**: tests that can only fail when someone edits the literal they assert, runtime assertions restating a type declaration, tests added for code the change did not touch; defensive branches, retries, timeouts, or guards for failures the package's environment and purpose exclude. Both are negative findings — flag their presence, not their absence.

## Self-review disposition

- Rank correctness findings by impact and reachability, then quality findings by maintenance weight. Keep micro polish visibly separate and do not inflate it into substance.
- Give each finding evidence (`file:line`), the concrete failure or maintenance cost, affected contract, and the smallest coherent fix.
- Keep performance and security out of scope unless the request, changed contract, or observed evidence makes either specialty relevant.
- During authorized implementation, fix confirmed in-scope issues, rerun affected checks, and include only unresolved limitations in the final report.
