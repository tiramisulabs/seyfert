# Review Contract

## Pin immutable scope

Record for each repository or supplied artifact:

- canonical repository identity and PR or change identifier;
- full base and head commit IDs for every PR or committed Git comparison;
- merge-base or explicit comparison range;
- local worktree and whether it matches either commit;
- cryptographic patch hash and content-addressed file snapshots for unstaged, untracked, supplied-patch, or non-Git reviews;
- relevant dependency, generated-artifact, or cross-repository revisions;
- requested exclusions and allowed actions.

For local changes, snapshot every reviewed file and the complete patch, including relevant untracked content, before analysis. Record the hash algorithm and hashes. If scope changes during review, preserve the prior snapshot and establish a new explicit revision; never silently mix evidence from both.

Read committed changes from a clean exact-revision worktree when practical. If the active worktree differs, inspect immutable objects or create an isolated worktree. Never silently substitute local `main`, a nearby commit, the current remote head, or mutable filesystem state.

Treat the ledger as persistent truth in governed mode. Treat source at recorded commits or content-addressed snapshots as code truth. If they disagree, correct the ledger with an explicit checkpoint; do not invent a reconciliation.

## Prove a candidate

Build a complete chain:

1. **Changed premise:** identify the reviewed change that creates or exposes the behavior.
2. **Reachable path:** trace real callers, state transitions, protocol messages, lifecycle events, or data flow. A caller the type system would accept is not a caller: `void`-return laxity, structural widening, and permissive signatures admit code no consumer writes. Require a caller, configuration, or documented usage that exists in scope.
3. **Broken contract:** identify the violated invariant using source, tests, configuration, public API, or an explicitly supported compatibility contract. Establish first that the failure is possible in the package's actual environment and declared purpose — from README, dependencies, transports, and runtime. A package that owns no I/O owes no I/O failure handling; an in-process component owes no delivery guarantees its documentation disclaims. When docs, tests, or callers show the behavior is intended, no contract is broken: route it to the summary as a design question or `EXCLUDED`, never as an inline finding, and do not propose a fix that changes the contract without an explicit user mandate.
4. **Concrete consequence:** describe a specific input and sequence that reaches the failure.
5. **Scope:** identify affected configurations and meaningful limits or mitigations.
6. **Anchor:** cite the exact commit or snapshot hash and the smallest relevant source location.
7. **Verification:** record static tracing, reproduction, test, build, or counterexample evidence.

Do not confirm a finding from suspicious syntax, an isolated callee, a speculative race, or a tool report alone. Verify real reachability and current contracts. Prefer a small executable reproduction when static evidence leaves material uncertainty. A reproduction proves a mechanism, not a defect: reproducing behavior under inputs no in-scope caller produces, or under an implementation the declared callback contract does not support, leaves the candidate `REFUTED` or `NEEDS_EVIDENCE` — never `CONFIRMED` on mechanism alone.

## Assign one status

- `CANDIDATE`: not yet fully checked.
- `CONFIRMED`: the complete proof chain supports the proposed mechanism and impact.
- `NEEDS_NARROWING`: the root is real but wording, affected scope, severity, or consequence overclaims.
- `REFUTED`: a caller, guard, runtime fact, or counterexample breaks the proposed proof chain.
- `EXCLUDED`: valid or unresolved material intentionally outside requested review scope; state why.
- `DUPLICATE`: covered by another canonical root; link that root.
- `NEEDS_EVIDENCE`: plausible but not publishable with available evidence.

Do not convert uncertainty into low severity. Omit `NEEDS_EVIDENCE` from actionable review comments and disclose it only when useful.

## Assign severity from impact

Use repository-native labels when defined. Otherwise use:

- `P0`: release or operation must stop; broad catastrophic impact is demonstrated.
- `P1`: merge blocker causing data loss, security failure, deadlock, persistent outage, broken public contract, or a common critical path failure.
- `P2`: real functional or reliability defect with bounded scope, recoverability, or uncommon prerequisites.
- `P3`: low-impact maintainability or correctness risk worth addressing, not a speculative preference.

Calibrate severity from demonstrated consequence, likelihood, blast radius, recovery, and existing mitigation. Never inflate severity to increase attention.

## Separate baselines

Classify each failure as introduced by the diff, pre-existing, exposed but not caused by the diff, or unrelated. Review comments should normally target introduced defects. Report blocking baseline limitations separately when they prevent proof.

Treat passing tests as evidence, not proof of absence. Treat failing tests as evidence only after attributing them to the reviewed change or baseline.
