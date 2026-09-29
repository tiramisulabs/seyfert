# Behavioral Contracts

Define observable behavior before choosing syntax. Trace producers, consumers, ownership, and terminal paths across the real caller chain.

## Errors

- Distinguish invalid input, expected absence, retryable failure, cancellation, and terminal failure when callers react differently.
- Preserve useful cause and context when translating an error. Do not replace a specific failure with an untraceable generic one.
- Settle every owned promise on success and failure. Do not swallow a rejection merely to keep a process alive.
- Keep callback failures from silently blocking a serialized queue or lifecycle transition forever. Bound or detach user-extensible work only when the public contract permits it.
- Emit terminal failure through the same observable surface that consumers use for success, or provide an equally explicit failure surface.

## Async work and concurrency

- Identify the owner of every task, timer, listener, transport, child process, and shared resource.
- Preserve required ordering at the layer that actually serializes work. A higher-level queue does not guarantee order after independent downstream dispatch.
- Correlate requests and acknowledgements with an identity that cannot be confused by retries, reconnects, or reused numeric IDs.
- Reject stale work with an incarnation, epoch, generation, or equivalent token when resources can be replaced under the same logical identity.
- Make shared-state commits atomic from observers' perspective. Do not publish half of a topology or configuration transition.
- Bound concurrency using repository and runtime constraints. Define whether one failure cancels, aggregates, retries, or leaves other work running.

## Lifecycle and state

- Enumerate valid states and transitions, including startup, ready, draining, stopping, failed, and closed states that apply.
- Make transitions idempotent where duplicate events or retries are possible.
- Track distinct readiness facts, not callback counts, when one participant can report more than once.
- Fence late events after replacement or closure. Remove ownership only if the terminating resource is still the current owner.
- Define cutover ordering explicitly: stage, activate, acknowledge, drain, and retire in the order required by the contract.
- Clear timers and listeners symmetrically. Prevent post-close callbacks from reviving or mutating closed state.

## Public and cross-component contracts

- Validate configuration at the earliest authoritative boundary, including finite numbers, ranges, combinations, transport capabilities, runtime limits (a timer delay above the platform maximum silently clamps), and cross-field consistency (values that must agree across a whole topology or option set).
- Keep identifiers injective. Use structured tuples or unambiguous encoding when concatenation could collide.
- Treat public callback timing, error delivery, ordering, and cancellation behavior as API surface.
- When one domain fact crosses multiple representations, map peer fields and preserve semantic identity, interpretability, units, timezone, encoding, precision, and absence behavior unless the target surface has an evidenced reason to differ. Field presence alone does not preserve the contract.
- Update all producers, consumers, tests, types, declarations, and dependency metadata when a contract changes.
- Preserve compatibility paths unless removal is requested or required by the accepted behavior.
