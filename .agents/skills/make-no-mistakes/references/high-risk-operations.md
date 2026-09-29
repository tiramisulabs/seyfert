# High-Risk Operations

Use this playbook for production, authentication, security, payments, legal or retention constraints, live data, migrations, dependency changes, global installations or configuration, destructive commands, deployments, force pushes, or other difficult-to-reverse actions. Routine reversible workspace-local dependency hydration that leaves delivered files unchanged does not require this playbook.

## Before Mutation

1. Confirm the exact target: environment, account, repository, branch, resource ID, database, table, service, version, or path.
2. Inspect current state read-only and save only the minimum evidence needed.
3. State the hard constraints and intended end state.
4. Prefer a dry-run, preview, plan, transaction, backup, or reversible intermediate state.
5. Check authorization for the mutation class and exact target. A direct current request naming both is sufficient within its stated scope; continue without reconfirming it. Permission only to investigate, diagnose, preview, or plan is not permission to mutate.
6. Verify the command or API contract for the installed or targeted version.
7. Identify rollback or recovery before proceeding.

Do not expose secrets in commands, logs, patches, progress updates, or final answers. Avoid broad searches through credential stores or private memory when a narrow source is available.

## During Mutation

- Use the narrowest command and target selector.
- Avoid compound destructive shell commands.
- Stop on unexpected target, count, diff, permission, or response shape.
- Do not improvise through a safety check failure; inspect and reassess.
- Preserve logs or response identifiers only when needed for verification and redact sensitive values.

## After Mutation

1. Re-fetch state through a read-only path.
2. Compare actual state with the intended end state and expected count.
3. Check the user-visible or consumer-visible path, not only the control-plane response.
4. Confirm no adjacent resources changed unexpectedly.
5. Report exact success evidence, rollback status, and any delayed verification still pending.

## Special Cases

### Data and Migrations

Inspect schema, cardinality, constraints, and affected-row estimates first. Prefer transactional or staged migrations. Verify both transformed data and downstream readers. Never treat a successful migration command as proof that application behavior is correct.

### Dependencies and Global Configuration

Record current version and effective configuration before changing them. Use the runtime or binary that actually owns the target configuration. After installation, verify discovery, enabled state, loaded capabilities, and a harmless functional smoke. Do not repeat installation blindly when the desired state already exists.

### Git and Publication

Verify branch, base, target, staged files, and remote tracking immediately before commit or push. Use force operations only with explicit authorization and the safest available lease protection. Re-check remote or PR state after publication.

### Production and External APIs

Separate authentication success, mutation acceptance, eventual processing, and final user-visible state. If the system is eventually consistent, define the monitoring window and do not call it complete before the required state appears.
