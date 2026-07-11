---
"rforge": patch
---

Correct and unify how the bundled R-Machine LLM Skill explains dependency declaration.

The Skill framed `withDeps` and consumer plugs as two different mechanisms, and left the consumer as an implicit "reads families together" — which let an LLM treat plugs as unconstrained glass. In reality it is **one** declaration mechanism (list or map of namespaces) whose allowed families are keyed on the declaring site, and each consumer plug is pinned by the compiler to its own catalog (`res-atlas.ts`): `DirectPlug` → base + shell; `ServerPlug` → inner + base + shell; `Plug`/`ClientPlug` → base + outer + vertex + shell. `dep-asymmetry.md` now carries both matrices (resource→resource and consumer→resource) with the core / server-half / client-half framing, and `plug.md` / `client-plug.md` / `server-plug.md` each state their plug's allowed families explicitly (e.g. a `ClientPlug` cannot reach a server-only `inner/` gear).
