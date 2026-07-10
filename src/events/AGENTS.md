# Events subsystem

Read the repository-root and `src/AGENTS.md` guides first. This guide owns
gateway/custom event types, loading, dispatch, hooks, event transforms, and
event-side cache ordering. For cross-cutting work, follow the root routing table
for every affected path and verification step.

- `EventHandler` maps gateway names to hooks and transformed event arguments.
- `CustomEventHandler` owns custom events (`runCustom`/`emit`) and injects the
  client according to the existing event contract.
- Gateway hooks under `src/events/hooks/` transform event arguments and may
  inspect the previous cache value. `EventHandler.runEvent()` then awaits the
  actual mutation through `Cache.onPacket()`/`onPacketDefault()` before running
  event listeners. Keep transformation and cache ownership distinct.
- Cloudflare Worker reload restrictions are intentional; preserve explicit
  `RELOAD_NOT_SUPPORTED` behavior.
- Follow the client guide for the packet-level ordering around RAW events,
  collectors, interaction dispatch, and ready-state transformation.
