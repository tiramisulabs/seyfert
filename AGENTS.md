# Developing Seyfert

Hierarchical `AGENTS.md` files split ownership: this root owns universal
workflow, routing, review, Git, and completion; nested guides own source, tests,
and subsystems. For consumer recipes use public docs, verified against this
checkout; this is not a bot tutorial.

## Required instruction routing

Codex auto-loads one guide per directory from project root to cwd, under its
default 32 KiB combined cap. A root-started agent may not receive nested guides.
**Before editing, read this guide plus every guide routed below for every
affected path, whether auto-loaded or not.** Subsystem guides add to, never
replace, `src/AGENTS.md`.

| Path or change | Additional guide(s) to read | Ownership |
| --- | --- | --- |
| Repository configuration, workflows, or root files | None | Universal workflow and repository boundaries in this file |
| `src/**` | `src/AGENTS.md` | Public API, type system, source style, async behavior, diagnostics, compatibility |
| `src/client/**` | `src/client/AGENTS.md` | Client lifecycle, packet dispatch, transformers, collectors, plugins |
| `src/commands/**` | `src/commands/AGENTS.md` | Declarations, options, contexts, loading, application and prefix dispatch |
| `src/components/**` | `src/components/AGENTS.md` | Components, modals, interaction contexts, component collectors |
| `src/events/**` | `src/events/AGENTS.md` | Gateway/custom events, hooks, cache ordering, reload behavior |
| `src/api/**` | `src/api/AGENTS.md` | REST transport, route proxy, retries, rate limits, route types |
| `src/common/shorters/**` | `src/api/AGENTS.md` and `src/common/shorters/AGENTS.md` | REST-layer boundary plus high-level resource operations |
| `src/cache/**` | `src/cache/AGENTS.md` | Cache facade, adapters, resources, intents, packet updates |
| `src/structures/**` | `src/structures/AGENTS.md` | Transformed structures, methods, guards, declaration merging |
| `src/websocket/**` | `src/websocket/AGENTS.md` | Shards, sockets, reconnects, sharding, workers, managers |
| `tests/**` | `tests/AGENTS.md` | Test ownership, compiler contracts, commands, portability, test style |
| Any build, typecheck, test, formatter, or portability verification | `tests/AGENTS.md` | Command selection, mutating-script warnings, verification ladder, runtime parity |

For cross-cutting work, apply every table row matching an affected path or
verification step. A nearest-path guide is insufficient when the contract
crosses ownership boundaries.

## Source of truth

Use this order when sources disagree:

1. The current checkout and branch.
2. `src/` runtime code and exported types.
3. The tests and compiler contracts in `tests/`.
4. Generated declarations from a fresh local build.
5. Public documentation and external examples.

Never prefer remembered, published, or documented APIs over this branch. Read
`package.json`, `src/index.ts`, the feature barrel, implementation, closest
tests, and routed guides. `lib/` is generated/untracked: build for declarations;
never edit or include it.

## Before editing

1. Check status, branch, and diff; preserve unrelated work.
2. Classify the contract: export, runtime, inference, gateway payload, REST
   route, cache behavior, or internal implementation.
3. Trace definition, barrels/root export, implementation, wrappers, direct
   consumers, and tests before choosing the edit point.
4. Prove public/type changes with compiler contracts, runtime changes with
   executable regressions, and changes spanning both with both.
5. Patch the owner; never hide core bugs behind consumer casts, duplicate
   helpers, or docs-only workarounds.

## Independent self-review

Always self-review and validate proportionally. Independent review is only for
large/material changes: root exports/declarations; registry/client inference;
plugin lifecycle; gateway/worker behavior; cache; REST transport; runtime
portability; behavior across owning subsystems; or explicit user request. Local
low-risk fixes use main-thread review and targeted validation. The reviewer is
a different, non-participant, read-only agent.

- After implementation/validation stabilizes, spawn one reviewer. Context and
  independence are separate. State its initial mode and exact `fork_turns` in
  the spawn prompt; default to `fresh`.
  - `fresh`: `fork_turns="none"`; use for unbiased/anchoring-resistant,
    public/high-risk/ambiguous, or requested context-free review. Reveal no
    rationale, intended solution, or suspected weaknesses.
  - `contextual`: `fork_turns="all"` or a positive window; reuse prior
    readings/decisions, but require challenge, not defense. It may improve
    exact-prefix prompt-cache reuse; never promise host/model-dependent hits,
    and confirm through exposed usage telemetry.
- Both modes read applicable instructions and inspect `git status`, staged,
  unstaged, and full relevant untracked files (`git diff` is insufficient),
  then report correctness/regression risks without editing.
- Verify findings, fix only confirmed issues, and rerun checks. After edits,
  follow up with the same reviewer, identify the final change set, and state it
  is reused, not newly fresh. A fresh reviewer retains its review context and
  findings without receiving implementation history.
- One reviewer per scope by default. Replace only if it joined implementation,
  is unavailable/failed, needed specialty or context mode materially changes,
  or the user asks for a new perspective.

## Release and Git boundaries

- Do not add a changeset unless explicitly requested; its configuration or
  release automation does not authorize one during ordinary development.
- Do not change package versions, release branches, workflows, tags, or publish
  configuration unless the task explicitly requests release work.
- Do not commit, push, open a PR, publish, or deploy unless explicitly
  authorized.
- Before authorized Git actions, re-check the branch and stage only intended
  files.

When a commit is authorized, `commitlint.config.js` and `.husky/commit-msg`
enforce Conventional Commits. Use a concise title such as:

```text
fix(commands): preserve middleware rejection semantics
feat: export logger types from the root
feat!: remove a legacy public contract
```

Use a scope when it identifies the owning subsystem; it is optional. Use `!`
and a `BREAKING CHANGE:` body only for a real breaking public contract. Recent
history contains older exceptions, but they are not the rule for new commits.

## Completion checklist

Before handing off a change:

- the edit is in the subsystem that owns the contract;
- public exports, declarations, runtime behavior, and docs/comments agree;
- direct callers and adjacent shared contexts were reviewed;
- targeted tests prove the regression or contract;
- the build/typecheck/full suite required by the blast radius passed freshly;
- relevant Node/Bun/Deno behavior was checked when portability changed;
- the full diff was read top to bottom;
- when required, one different non-participant agent reviewed the final code in
  the selected mode, was reused for follow-ups, and all confirmed findings were
  resolved;
- no generated `lib/`, debug output, secrets, dead scaffolding, unrelated
  formatting, or user work is included;
- no release or external action was inferred beyond the request;
- any skipped verification has a concrete, disclosed residual risk.
