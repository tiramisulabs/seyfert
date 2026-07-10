# Websocket, sharding, and workers subsystem

Read the repository-root and `src/AGENTS.md` guides first. This guide owns
shards, sockets, heartbeat/reconnect logic, sharding, workers, and managers. For
cross-cutting work, follow the root routing table for every affected path and
verification step.

- Preserve socket lifecycle, heartbeat/reconnect ordering, shard startup, and
  worker/manager message contracts when changing this subsystem.
- Preserve the configured gateway send path and its async/rejection semantics;
  the client guide owns plugin wrapping, veto behavior, and packet dispatch.
- Worker, filesystem, Web API, or transport portability changes require the
  relevant Bun/Deno path from `tests/AGENTS.md`, in addition to targeted gateway
  and worker tests.
- Apply the source-wide typing, async, wire-format, and portability rules from
  `src/AGENTS.md`.
