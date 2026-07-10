# Cache subsystem

Read the repository-root and `src/AGENTS.md` guides first. This guide owns the
cache facade, adapters, resources, intent checks, bulk operations, and packet-
driven updates. For cross-cutting work, follow the root routing table for every
affected path and verification step.

- Cache behavior spans `src/cache/index.ts`, an adapter, a resource, gateway
  hooks, and sometimes a shorter/structure.
- Respect disabled-cache behavior, intent requirements, sync/async adapter
  typing, worker adapters, and bulk-operation contracts.
- Cache resources own hashing, relationships, intents, and sync/async adapter
  behavior. Other subsystems must not access adapter storage directly.
- The event/cache transformation and mutation boundary is owned by the events
  guide; read it before changing packet-driven behavior.
