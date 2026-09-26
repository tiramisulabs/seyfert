---
name: make-no-mistakes
description: Apply proportional rigor to high-risk implementation or operations involving public contracts, security, payments, data, production, migrations, or exhaustive scope.
---

# Make No Mistakes

Protect consequential outcomes with current evidence and verification proportional to the real blast radius. This skill is for work where an ordinary implementation pass would leave material risk, not for routine explanations or trivial edits.

## Route to the relevant rigor

Read [references/evidence-playbook.md](references/evidence-playbook.md) for ambiguous or repeated bugs, exhaustive requests, unfamiliar APIs, shared contracts, or failures that cross components.

Read [references/high-risk-operations.md](references/high-risk-operations.md) before production operations, security or authentication changes, payments, migrations, destructive actions, global configuration, dependency changes with broad impact, or difficult-to-reverse data writes.

Do not load both references unless both kinds of risk are present.

## Work from the actual target

Establish the requested outcome, relevant authority, and evidence that would prove success. Inspect the exact checkout, diff, caller path, contract, command, live object, or target that matters. Use the user's real reproduction or inputs when available, and treat automated findings or prior explanations as hypotheses until current evidence supports them.

Choose the smallest coherent root-cause change that preserves supported behavior outside the request. Routine implementation decisions within that outcome do not require renewed approval. Stop only when a decision would materially change the target, public contract, cost, irreversibility, or authorized external effect.

Preserve unrelated work. Do not infer authority to commit, push, publish, deploy, install globally, mutate production, or perform destructive cleanup from authorization to implement or investigate. Do not ask again for an action and target already authorized unless inspection reveals a materially different effect.

## Verify proportionally

Use checks that can reject a plausible wrong result. A focused reversible change may need only the affected contract and consumer checks. Broaden verification when the change crosses packages or representations, affects public behavior or data, or when evidence contradicts the working hypothesis.

For exhaustive scope, define the source-of-truth set, enumerate it, give each member a disposition, and reconcile the final state with the original inventory. Do not silently sample a request for all occurrences.

After an external mutation, re-fetch the authoritative state. Separate source checks, builds, tests, runtime behavior, deployment, and live consumer evidence rather than treating one as proof of another.

When a check fails, collect evidence before trying another fix. Change hypotheses instead of repeating cosmetic variants. Preserve a rollback path for risky changes and stop at the relevant authority or safety boundary.

## Completion

Continue through implementation, relevant verification, correction of in-scope failures, and final inspection. Completion requires evidence for the requested outcome, no unrelated delivered changes, and a clear account of any unavailable check or residual risk. Do not add ceremony, tracking artifacts, broad test matrices, or independent review unless the risk makes them useful.
