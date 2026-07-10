# High-level resource shorters

Follow the repository-root routing table before this guide; it supplies the
source-wide and REST-layer prerequisites. This guide owns implementation order
and cache/transform responsibilities under `src/common/shorters/`.

- Shorters use the REST proxy, own cache maintenance, resolve files, transform
  payloads, then return structures; preserve local ordering.
- Follow the API guide's layer boundary and shorter-first endpoint rule. Raw
  proxy/request work belongs below this layer, and structures/transformers own
  transformed return values.
- A shorter that touches cache or structure contracts also requires the cache
  or structures guide and their owning tests.
