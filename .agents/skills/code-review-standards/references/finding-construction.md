# Finding Construction

## Account by root cause

Assign a stable root ID to each distinct violated invariant or unsafe transition. Record aliases from parallel review arms, tools, or earlier drafts under the canonical root.

Count a root exactly once in one of these terminal buckets:

- actionable comment coverage;
- explicit summary-only coverage;
- excluded;
- refuted;
- duplicate of a named canonical root;
- unresolved and not publishable.

Preserve the mapping when comments are regrouped. A comment count is not a root count.

## Group only coherent fixes

Group roots when all of these are true:

- one changed-line anchor honestly introduces the shared problem;
- one mechanism explanation covers every root without switching domains;
- one remediation direction resolves them together;
- one severity and audience remain accurate;
- the combined comment stays readable.

Split when roots have different state machines, owners, fixes, severities, anchors, or independently actionable outcomes. Split a comment that needs “also,” unrelated paragraphs, multiple remedies, or a vague umbrella title to hold together.

Do not merge roots merely because they share a file, callback, helper, lock, identifier, or observed symptom. Do not split one invariant into every affected call site.

## Keep repositories separate

Maintain distinct finding tables, drafts, summaries, decisions, anchors, and publication permissions for each PR. Use cross-repository evidence to prove a local contract, then place the actionable comment in the repository that owns the defective contract or change.

If both repositories independently violate a shared contract, retain separate roots and comments with explicit counterpart evidence. Do not count the same local root in both PRs.

State exact counterpart commits. A compatible behavior at one revision does not prove compatibility at another.

## Validate anchors

Anchor inline feedback only to a line added or modified in the exact committed diff or content-addressed patch under review. For publication, also require a line accepted by the publication API. Select the smallest changed line that owns the broken behavior, not merely a nearby caller or an unchanged line where the failure surfaces.

For each anchor, record repository or artifact, commit or snapshot hash, path, side, and line or diff position. Verify programmatically when possible. Recheck after rebases, force-pushes, local edits, formatting, or grouping edits.

Move unanchorable but important findings to the review summary. Omit location-free speculation.

## Draft an actionable comment

Write GitHub-ready titles, bodies, and summaries in English unless the current user or repository instructions require another language. Keep analysis and decision discussion in the user's preferred language when useful.

Use this shape:

1. concise imperative or consequence-focused title with calibrated severity;
2. exact trigger and state transition;
3. violated contract;
4. concrete failure outcome;
5. bounded remediation direction when it clarifies the contract.

Write the smallest claim the evidence proves. Name prerequisites and mitigations. Distinguish “can,” “will,” “always,” “until timeout,” “permanently,” and “silently” precisely. Avoid intent claims, rhetorical questions, praise, style preferences, generic best practices, and implementation prescriptions unsupported by the repository.

Recheck every noun and quantifier against the exact source. Replace ambiguous references such as “this,” “worker,” “request,” or “state” with the concrete identity or phase when multiple interpretations exist.

## Build the summary from final state

Derive the summary after comments freeze. Include verdict, dominant risks, actionable-root total, explicit exclusions or refutations, verification limits, and cross-repository constraints needed to understand the PR.

Do not introduce a new root, stronger impact, broader scope, or different severity in the summary. Ensure every summarized blocker maps to at least one final comment or named summary-only root. Ensure omitted comments disappear from the summary.
