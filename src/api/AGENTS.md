# REST, routes, and transport subsystem

Read the repository-root and `src/AGENTS.md` guides first. This guide owns REST
transport, retries, rate limits, route proxying, buckets, route types, and the
boundary to shorters and structures. For cross-cutting work, follow the root
routing table for every affected path and verification step.

Keep the layers distinct:

1. `src/types/rest/` and `src/types/payloads/` describe Discord data.
2. `src/api/Routes/` describes route proxy shapes; these are types, not a
   runtime `Routes` object.
3. `src/api/Router.ts` builds the runtime proxy.
4. `src/api/api.ts` handles auth, files, retries, rate limits, worker proxying,
   and plugin REST observers.
5. `src/common/shorters/` provides the public high-level operation.
6. `src/client/transformers.ts` and `src/structures/` provide transformed
   return values when appropriate.

For a Discord endpoint, prefer adding or extending the shorter when it is a
normal public resource operation. Use the raw proxy/request layer only where no
shorter belongs. Do not introduce a parallel `fetch`/`axios` path around the
REST handler.
