# Client and plugin subsystem

Read the repository-root and `src/AGENTS.md` guides first. This guide owns
client lifecycle, gateway semantic dispatch, client collectors/transformers,
and the plugin subsystem. For cross-cutting work, follow the root routing table
for every affected path and verification step.

## Ownership map

| Path | Responsibility |
| --- | --- |
| `src/client/base.ts` | Shared client lifecycle, services, configuration, command/component/lang loading, uploads, and plugin integration |
| `src/client/client.ts` | Gateway client, packet dispatch, shard startup, events, and gateway plugin interception |
| `src/client/httpclient.ts` | HTTP interaction client |
| `src/client/workerclient.ts` | Worker client, manager messaging, worker proxying, and worker-side gateway handling |
| `src/client/collectors.ts` | RAW, gateway-event, and custom-event collectors; distinct from component collectors |
| `src/client/transformers.ts` | Converts Discord payloads into Seyfert structures |
| `src/client/plugins.ts` | Resolves plugins, binds them to clients, runs lifecycle/hooks, and applies contributions |
| `src/client/plugins/types.ts` | Public plugin contract, `SeyfertRegistry`, extensions, hooks, diagnostics, and contribution types |
| `src/client/plugins/api.ts` | Mutation API exposed during plugin lifecycle phases |
| `src/client/plugins/registry.ts` | Runtime registry, requirements, diagnostics, ownership, and cleanup bookkeeping |
| `src/client/plugins/order.ts` | Stable contribution ordering |
| `src/client/plugins/shared.ts` | Typed shared capabilities and disposal |
| `src/client/plugins/errors.ts` | Plugin-specific wrapped and aggregate errors |

## Client startup and shutdown

- `BaseClient` constructs REST, cache, handlers, shorters, langs, plugins, and
  shared plugin state.
- `BaseClient.start()` validates the token, installs the command handler, sets
  up plugins, starts the cache adapter, and loads langs, commands, and
  components with plugin hooks/contributions.
- `Client.start()` adds gateway event loading and shard execution.
- `HttpClient.start()` currently runs the base startup and calls the inherited
  `execute(options.httpConnection)`. The inherited implementation only handles
  debug logger setup; this checkout does not wire `HttpServerAdapter` into a
  real HTTP server. Treat HTTP-server behavior as an incomplete contract and
  inspect callers/types before extending it.
- `WorkerClient.start()` wires manager messaging, worker proxy/cache behavior,
  plugin intents, base startup, and worker event handling.
- `start()` does not upload application commands. `uploadCommands()` is a
  separate public operation and must remain explicit.
- `BaseClient.close()` owns plugin teardown only. Do not silently expand it to
  close the gateway, REST client, or cache adapter without an intentional
  public lifecycle decision.

When changing startup ordering, inspect plugin hooks, service replacement,
cache adapter initialization, file loaders, all three client variants, and the
failure/cleanup path.

## Gateway packets

`Client.onPacket()` follows this shape:

1. Plugin gateway-dispatch interceptors.
2. Launch the RAW event and RAW collector with `Promise.allSettled()` without
   awaiting them (fire-and-forget relative to the remaining packet path).
3. Apply specialized presence/member filtering where applicable.
4. Await the packet-specific event path; `EventHandler.execute()` awaits both
   `runEvent()` and the event-specific collector.
5. Dispatch commands, components, or modals after event execution for
   interaction packets, or prefix commands for message packets.
6. Transform ready state and emit bot-ready when all shards are ready.

Outgoing gateway payloads pass through plugin wrappers before the configured
send handler. A plugin may replace or veto a payload/packet with `null`; preserve
that control flow and its diagnostics.

## Plugins

Plugin lifecycle is:

```text
register (synchronous construction) -> setup (client start) -> teardown (close, reverse order)
```

Plugin changes must preserve:

- imported-plugin closure and extension inference;
- `SeyfertRegistry` augmentation and `RegisteredPlugins`;
- contribution ownership, overrides/removals, stable ordering, and cleanup via
  lifecycle API and registry ownership, without direct array mutation or
  duplicated ordering;
- lifecycle phase restrictions;
- requirements and optional-requirement diagnostics;
- shared capability creation/disposal;
- commands, components, modals, events, hooks, middleware, REST observers,
  cache resources, gateway wrappers/interceptors, handler creators, and
  transformers;
- wrapped single errors and aggregate setup/teardown failures.

Plugin lifecycle failures use their plugin error wrappers/aggregate error, not
a generic `SeyfertError` replacement.

Keep plugin `meta` descriptive rather than using it as a substitute for typed
operational handles. The current type deliberately accepts arbitrary metadata,
and requirement resolution may read `meta.version`; preserve that behavior.
Use `shared` for genuine cross-plugin/application capabilities, while
package-local handles may remain typed top-level extras as long as reserved
Seyfert keys stay protected.
