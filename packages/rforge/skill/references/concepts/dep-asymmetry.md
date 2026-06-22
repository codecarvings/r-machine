# Concept — Dependency-graph asymmetry & bridge gears

The families form a **deliberately asymmetric** dependency graph, enforced by the
compiler at the `withDeps(...)` call site. Each family may depend only on:

| Family                  | May depend on                                           |
| ----------------------- | ------------------------------------------------------- |
| `gear:inner`            | `gear:inner`, `gear:base`                               |
| `gear:base`             | `gear:base`                                             |
| `gear:outer`            | `gear:outer`, `gear:base`                               |
| `gear:outer(vertex)`    | same as `gear:outer` — **but cannot be a dep itself**   |
| `shell` / `shell(mono)` | `shell`, `shell(mono)`, `gear:base` _(only if bridged)_ |

Key consequences:

- **No dep path connects `gear:inner` to `gear:outer`/`vertex`/`shell`.** Inner
  (server-only) and outer (stateful/client) live in separate halves of the graph.
- **Shells can never be a dep of a gear** — content depends on logic, not the
  reverse.
- **Vertex gears are consumer-only** — per-consumer instances, so nothing may
  depend on one.

**Bridge gears.** A shell may reach a `gear:base` **only** if that namespace is
listed in `bridgeGears` on `RMachine.create(...)`. The option is type-narrowed to
`gear:base` namespaces (an outer/inner namespace there is a compile error). This
keeps the shell→logic door explicit, not open by default.

```ts
RMachine.create({ /* … */, bridgeGears: ["base/config"] });
// now a shell may: Shell.withDeps("base/config").define(...)
```

Why it matters: the asymmetry is what makes "where can X live / what can it use?"
have a single compiler-checked answer — the structural discipline, not a
convention. The full dep matrix is also summarised in `SKILL.md` (Step 1).

**The consumer is where families meet.** A gear can't depend on a shell, yet a
component routinely needs both behavior (the gear) and localized content (the
shell). That's not a contradiction: a **consumer plug** binds multiple namespaces
at once — `Plug("outer/timer", "shell/timer")` → `[timer, t, $]`. The dep graph
constrains how resources depend on each other; the consumer is the meeting point
where independent families are read together. See
[../patterns/consume/plug.md](../patterns/consume/plug.md#consume-multiple-resources).
