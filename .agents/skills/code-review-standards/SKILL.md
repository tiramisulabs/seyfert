---
name: code-review-standards
description: Review a concrete code change against an exact revision and produce evidence-backed findings. Use for PRs, patches, snapshots, or proposed review comments.
---

# Code Review Standards

Review the requested change without editing it unless the user separately authorizes implementation. Pin the exact revision or content snapshot, preserve unrelated work, and distinguish defects introduced by the change from pre-existing behavior.

## Choose the review depth

Use a bounded review for one change assessed in one sitting. Inspect the complete diff and trace relevant callers, contracts, tests, generated boundaries, and cross-repository counterparts only as far as the changed behavior requires.

Use a governed review when decisions must survive across sessions or repositories, findings will be approved one by one, publication is being prepared, or a persistent implementation handoff is required. Read [governed-workflow.md](references/governed-workflow.md) before starting that mode and use [templates.md](references/templates.md) only for artifacts the workflow actually needs.

An independent adversarial pass can improve a broad or consequential review when delegation is authorized and available. It is not a prerequisite for an ordinary bounded review.

## Decide findings from evidence

Treat proposed comments, automated findings, and prior reviews as hypotheses. Establish the intended contract from current source, configuration, callers, tests, and runtime behavior. Read [review-contract.md](references/review-contract.md) when deciding whether a candidate is actionable and how severe it is.

For each actionable finding:

- show a reachable failure or concrete maintenance cost;
- explain the violated repository-supported contract;
- anchor inline feedback to a changed line in the exact reviewed diff;
- calibrate severity to impact and likelihood;
- deduplicate comments that share one cause.

Read [finding-construction.md](references/finding-construction.md) when drafting or grouping publication-ready comments. Use [adversarial-review.md](references/adversarial-review.md) only when running a genuinely independent pass.

A green test suite does not clear paths that were not exercised. Conversely, do not turn preferences, hypothetical edge cases, or pre-existing defects into blockers for the reviewed change.

## Preserve action boundaries

A review request authorizes read-only investigation, not fixes, commits, pushes, publication, PR state changes, or deployments. Wording approval does not authorize publication. Before any authorized publication, reconfirm that the remote head still matches the reviewed revision and revalidate affected anchors if it changed.

## Report

Lead with ranked findings. If there are none, say so directly and state any material evidence gaps. Identify the exact revision or snapshot reviewed and distinguish local checks, remote CI, deployment state, and live behavior whenever those boundaries matter.
