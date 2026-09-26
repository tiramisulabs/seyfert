---
name: scope-discipline
description: Prevent scope creep when a plan or implementation starts absorbing adjacent fixes, speculative compatibility work, migrations, or unrelated refactors.
---

# Scope Discipline

Keep the delivered change anchored to the requested outcome. A discovered issue is evidence to classify, not automatic permission to solve an adjacent problem.

## Hold the goal, not a frozen file list

Identify the user-visible outcome and any explicit non-goals. Let the implementation follow repository evidence within that boundary. Routine choices such as using an existing helper, touching a necessary consumer, or adding a focused file do not require a formal amendment when they are clearly necessary to complete the authorized outcome.

Reconsider scope when a proposed addition changes the product contract, introduces a separately deployable mechanism, creates migration or backfill obligations, adds compatibility behavior the user did not request, or could reasonably stand as its own ticket.

## Route discoveries

- Fix defects introduced by the current work.
- Resolve implementation details that are necessary for the requested outcome.
- If the stated plan cannot achieve the outcome, explain the conflicting evidence and the smallest material decision needed.
- Report pre-existing or adjacent defects without changing them unless they block the authorized result.
- Do not implement hypothetical states, future options, fallbacks, or migrations without evidence that the requested outcome requires them.

Stop for user direction only when the available choices materially change behavior, scope, cost, risk, or external effects. Continue safe investigation and independent work while that decision is pending.

## Detect accretion

Re-derive the change from the goal when mechanisms, branches, compatibility paths, or touched subsystems keep increasing across review rounds. Prefer removing incidental complexity over adding another exception. A new file or larger diff is a signal to inspect, not proof of scope violation; judge whether it is necessary for the outcome.

Do not use “while here,” speculative legacy handling, generalized options, or unrelated cleanup to enlarge the task. Conversely, do not leave the requested behavior incomplete merely to preserve an early implementation outline.

## Report

Mention adjacent findings, material deviations from the requested outcome, or decisions that remain open. Omit a ceremonial scope ledger when there were no meaningful deviations.
