# Governed Review Workflow

## Contents

- Create the persistent ledger first
- Review one item at a time when requested
- Freeze reviewed artifacts
- Audit the package
- Obtain an independent review
- Reconfirm moving state
- Prepare the publication manifest
- Hand confirmed roots to implementation

## Create the persistent ledger first

Create one canonical ledger before material analysis. Record:

- scope, exact commits or content hashes, repositories or artifacts, worktrees, and source artifacts;
- authority and action boundaries;
- candidate and canonical root tables;
- proof status, severity, anchors, and cross-repository evidence;
- grouping, splitting, omission, and wording decisions;
- coverage accounting and exclusions;
- verification results and limitations;
- timestamped checkpoints and next action.

Update it immediately after every material decision, including one-by-one user approval. Never rely on conversation history as the only record. On resume, read the ledger before drafts, verify recorded commits still exist or snapshot hashes still match preserved artifacts, and continue from the explicit next action.

## Review one item at a time when requested

For each proposed comment:

1. present its number and title;
2. reconfirm it against the exact commit or content-addressed snapshot;
3. explain the mechanism and state transitions;
4. give a concrete failure scenario;
5. identify overclaim or ambiguity;
6. recommend keep, revise, split, combine, or omit;
7. verify the changed-line anchor;
8. provide final publication-ready wording;
9. stop for the decision.

After the decision, update the ledger immediately and update the draft only as authorized. Preserve root accounting before moving to the next item.

## Freeze reviewed artifacts

Freeze the final per-PR draft only after decisions are incorporated, omissions removed, splits and merges applied, summaries revalidated, and all coverage reconciled. Record a cryptographic hash such as SHA-256 for each frozen file.

Treat wording, title, severity, grouping, anchor, coverage, exclusion, summary, or target-commit changes as freeze-invalidating. Reopen review for the affected artifact and generate a new hash. Do not silently patch a frozen package.

## Audit the package

Run a final audit that confirms:

- every actionable root appears exactly once;
- every duplicate names its canonical root;
- every exclusion and refutation remains explicit;
- no comment or summary overclaims the proof;
- no comments contradict each other;
- every inline anchor is a changed line at the frozen head;
- every summary claim maps to final coverage;
- per-PR artifacts remain separate;
- hashes match current bytes.

Use scripts for mechanical coverage, hash, and changed-line checks when the package is large. Retain human review for semantic grouping and wording.

## Obtain an independent review

Use a fresh non-participant reviewer for the complete frozen package. Give it the ledger, drafts, manifest, exact repositories and commits, and authority boundary. Do not give it the intended verdict, suspected weak spots, or prior reasoning beyond the artifacts under review.

Require read-only inspection of complete diffs, relevant untracked files, callers, contracts, coverage, exclusions, summaries, anchors, and hashes. Verify every returned finding before changing the package. After corrections, have the same reviewer recheck the final changed set; record the final disposition.

## Reconfirm moving state

Immediately before any publication action, query the authoritative remote state and compare each full head ID with the frozen head. If any head differs:

1. stop publication for that PR;
2. preserve the frozen package as historical evidence;
3. inspect the diff from frozen head to new head;
4. revalidate affected roots, anchors, wording, coverage, summary, and verdict;
5. refreeze and reaudit before requesting authorization again.

Do not infer the remote head from a local branch or stale metadata.

## Prepare the publication manifest

Record for each PR:

- repository, PR, state, base, frozen head, and current confirmed head;
- frozen draft path and hash;
- final review action and exact summary;
- ordered inline titles, bodies or draft references, anchors, and root coverage;
- excluded, refuted, duplicate, and unresolved roots;
- coverage and anchor audit results;
- independent-review result;
- explicit authorization state.

Request authorization separately for each PR and action. Treat silence, wording approval, prior review participation, and authorization for another PR as no authorization.

After publication, record returned review IDs, comment IDs, target commit, timestamp, and errors. Read back the remote review and compare it with the manifest.

## Hand confirmed roots to implementation

When implementation replaces publication, mark unpublished drafts and publication manifests superseded without deleting their evidence. Create an implementation manifest mapping each approved grouped change to:

- canonical root IDs and excluded aliases;
- repository and audited starting head;
- owned contract and required invariant;
- allowed scope and explicit non-goals;
- expected verification;
- requested commit granularity;
- local branch, resulting commit, and validation after implementation.

Do not choose code style or detailed implementation mechanics here. Invoke the implementation standards separately. Recheck remote heads before any eventual push and require explicit push authorization.
