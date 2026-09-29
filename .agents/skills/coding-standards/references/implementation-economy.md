# Implementation Economy

Economy measures mechanisms against invariants, not lines against a diff. The smallest coherent change still reshapes structure that obscures the domain; economy governs what may exist at all.

## State the demand for every mechanism

A mechanism is a construct that owns state or policy: a class, state machine, queue, cache, window, registry, epoch or generation token, error or outcome taxonomy, observer layer, or configuration option.

Introduce a mechanism with its demand stated in three parts:

1. the invariant it holds;
2. the consumer that exercises it within this same change;
3. the reason no construct already in scope holds that invariant.

When an invariant fits a mechanism that already exists, extend that mechanism. When the only consumer of a mechanism is a test, make it private or delete it and test through the surface real callers use.

Hold all stated invariants with the fewest interacting mechanisms. Every pair of interacting mechanisms is a correctness surface that must stay coherent through retries, reconnects, and shutdown; mechanisms multiply that surface quadratically while each one looks locally justified.

## One name per behavior

Name a behavior once and call that member at every call site, including exported names and forwarding methods. A second spelling for an existing behavior is surface without semantics.

## Export for a consumer that exists

Export a value when a consumer outside the module imports it in the current change; keep everything else module-private. Widening surface later is a cheap addition; narrowing it is a break.

A type reachable from an exported value's signature — a parameter, return, or public field type — is part of that value's surface: export it under its name so consumers can write the annotation the surface implies. A type no exported signature reaches stays private.

## Find utilities before deriving them

Before writing a helper, search the workspace and the platform runtime; import what already exists. When one format is both encoded and decoded in the same package, use one mechanism for both sides — the platform's when it provides one. The format's validation follows the same law: one named rule that the constructing side and the parsing side both call. Guard against states the runtime can produce; call members the runtime guarantees directly.

## Respond to defects by subtraction first

When a defect lives in the interaction of mechanisms, first remove or merge mechanisms so fewer parts hold the invariant; add a compensating mechanism only after subtraction cannot hold it. Mechanism count growing across review rounds signals the root shape is wrong.

Subtraction removes mechanisms, never invariants. Before deleting or merging a construct, restate the invariants it held — its validations, guards, fences, and bounds — and name where each now lives. An invariant whose triggering state no longer exists retires with that state; record the retirement.

## Re-derive when the shape outgrows the demand

Before writing, list the invariants and the mechanisms they demand; that list is the expected shape. When the implementation outgrows it, stop and re-derive the mechanism list from the invariants instead of continuing to type.
