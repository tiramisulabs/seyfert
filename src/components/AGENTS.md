# Components, modals, and collectors subsystem

Read the repository-root and `src/AGENTS.md` guides first. This guide owns
received components, modal/component contexts, loading, matching, execution,
and component collectors. For cross-cutting work, follow the root routing table
for every affected path and verification step.

- `ComponentHandler` owns component/modal loading, registration, matching,
  collectors, and execution.
- `ComponentContext`, `ModalContext`, and `InteractionContext` share response
  and client typing with commands.
- Preserve the distinction between run errors, middleware errors, and internal
  framework errors.
- The received-component/outbound-builder boundary and builder conventions are
  owned by `src/AGENTS.md`; follow that boundary before crossing layers.
