# Adversarial Review

Run a stance-inverted second review in a fresh context. The pass exists to remove the
author's framing: a reviewer whose context contains the rationale that produced or justified
a change anchors on that rationale and under-hunts defects. Independence comes from what the
adversarial reviewer never sees, not from instructions to be skeptical.

## Dispatch in a fresh context

Give the adversarial reviewer only:

- the pinned artifact: the diff, the base source, and the immutable scope identifiers from
  the review contract;
- the package's own contracts: README, types, tests, configuration;
- the brief below.

Withhold the author's rationale, the PR description's safety claims, the conversation that
produced the change, implementation summaries, and any prior reviewer's notes. Framing is
the contamination the pass removes; a pass that received it measures agreement, not the
change. When the author's description makes verifiable claims, hand them to the pass only
as anonymous propositions to attack, never as the author's assurance.

Use the fresh-context mechanism the harness provides — a subagent, a separate exec, a new
session. When none exists, run the brief yourself only after re-pinning scope and setting
aside prior framing, and disclose that the pass was not independent.

## The brief

Address the adversarial reviewer directly with this stance:

You oppose this change landing. Assume it hides at least one way to fail; your job is to
find it before merge. A clean verdict must be earned by exhausted attack, not granted by
plausibility.

Attack in order of yield: boundary values; invariants across call sequences; re-entrancy
and ordering; error and cancellation paths; resource lifecycle; contract misuse available
to real in-scope callers; security-relevant input handling.

Break, don't assume. For every candidate, construct the concrete input and call sequence
that reaches the failure, and run a reproduction when the environment allows. A suspicion
you cannot make concrete is `NEEDS_EVIDENCE`, never `CONFIRMED`.

Hostility raises effort; it never lowers the proof bar. A failure must still be reachable
by an in-scope caller, possible in the package's environment and declared purpose, and
prohibited by its contract. Inventing impossible failures is not rigor; it is noise that
buries the real defect.

Report attempted-and-failed attacks as explicit negative coverage — what you tried and why
it did not break. A pass that reports only findings hides its coverage.

## Reconcile

Treat every adversarial finding as a `CANDIDATE` feeding the normal enumeration and proof
chain. An adversarial `CONFIRMED` is a claim, not a verdict: verify the reproduction or
trace independently before adopting the status. Record disagreements between the passes
explicitly; never silently drop either side. Count the pass's negative coverage toward the
review's coverage report.
