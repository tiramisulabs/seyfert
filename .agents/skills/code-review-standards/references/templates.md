# Review Artifact Templates

## Contents

- Finding record
- Ledger skeleton
- Inline comment record
- Frozen review draft
- Publication manifest
- Implementation handoff
- Compact bounded-review report

## Finding record

```markdown
### <root-id> — <short root title>

- Repository / PR:
- Base / head commits or artifact hashes:
- Status: CANDIDATE | CONFIRMED | NEEDS_NARROWING | REFUTED | EXCLUDED | DUPLICATE | NEEDS_EVIDENCE
- Severity:
- Changed premise:
- Reachable path / state transitions:
- Broken contract:
- Concrete scenario and consequence:
- Scope / mitigation:
- Evidence and verification:
- Candidate anchor:
- Aliases / duplicate of:
- Coverage group:
- Decision / rationale:
```
## Ledger skeleton

```markdown
# <review> Ledger

**State:** Live — update after every material step
**Next action:** <single resumable action>

## Authority and action boundary
## Exact scope and immutable commits or content hashes
## Worktrees and source artifacts
## Canonical root table
| Root | PR | Status | Severity | Proof anchor | Coverage | Notes |
## Cross-repository contract evidence
## Excluded, refuted, duplicate, and unresolved roots
## Draft decisions
## Coverage accounting
| PR | Total roots | Actionable covered | Excluded | Refuted | Duplicate | Unresolved |
## Verification and limitations
## Timestamped checkpoints
```

## Inline comment record

```markdown
### <number>. <title>

- PR / frozen head:
- Anchor: `<path>:<changed-line>`
- Covers: `<root ids>`
- Severity:
- Decision: pending | approved | revised | split | combined | omitted

<publication-ready body>
```

## Frozen review draft

```markdown
# <repository PR> Review Draft

**Base:** `<full commit or content hash>`
**Head:** `<full commit or content hash>`
**State:** Frozen / unpublished
**SHA-256:** `<hash stored outside this file or computed before recording>`

## Summary
## Ordered inline comments
## Summary-only findings
## Excluded and refuted findings
## Coverage table
```

Avoid embedding a self-referential file hash in the bytes being hashed. Store the authoritative hash in the ledger and manifest, or hash a clearly delimited payload.

## Publication manifest

```markdown
# <review> Publication Manifest

## Global gates
- Coverage audit:
- Anchor audit:
- Independent review:
- No post-freeze edits:

## <PR>
- Remote state:
- Base / frozen head / reconfirmed head commits or hashes:
- Draft path / SHA-256:
- Proposed review action:
- Authorization: NOT REQUESTED | PENDING | AUTHORIZED | DECLINED | SUPERSEDED
- Final summary:
- Ordered inline comments and anchors:
- Root coverage:
- Exclusions / refutations / unresolved:
- Publication receipt:
```

## Implementation handoff

```markdown
# <review> Implementation Manifest

## Starting revisions and authority
## Approved grouped changes
| Change | Repository | Roots | Required invariant | Scope / non-goals | Verification | Commit |
## Preserved exclusions and refutations
## Local branches and resulting heads
## Validation results and baseline limitations
## Independent implementation review
## Commit / push / publication state
```

## Compact bounded-review report

```markdown
Reviewed: `<base>..<head commits or content-addressed patch>`
Verdict: approve | comment | request changes | no actionable findings

Actionable findings:
1. `<severity>` `<anchor>` — `<root and consequence>`

Coverage: `<confirmed roots covered>/<confirmed roots>`
Excluded or refuted: `<ids and short reasons>`
Verification: `<checks and limitations>`
Actions taken: `<read-only, draft only, or explicitly authorized mutation>`
```
