# Concept — Kits (ambient injected resources)

A **kit** curates a few resource namespaces and surfaces them as `$.kit.*` — so a
factory or a consumer can reach a shared helper (a formatter, a logger) without
declaring it as a dep every time. Each kit variant injects into a different layer:

| Kit         | Declared on             | Surfaces `$.kit.*` into                  |
| ----------- | ----------------------- | ---------------------------------------- |
| `gearKit`   | `RMachine.create`       | every `Inner`/`Base`/`OuterGear` factory |
| `shellKit`  | `RMachine.create`       | every `Shell` / `shell(mono)` factory    |
| `directKit` | `RMachine.create`       | every `DirectPlug` consumer call         |
| `kit`       | `ReactStandardStrategy` | every `Plug` consumer call               |
| `clientKit` | a `NextApp*Strategy`    | every `ClientPlug` consumer call         |
| `serverKit` | a `NextApp*Strategy`    | every `ServerPlug` consumer call         |

Notes:

- A kit entry is a **fully-resolved Surface** — the same shape a peer factory
  receives via its own `$.kit`. Next.js splits the consumer kit into independent
  `clientKit` / `serverKit` because the two runtimes are separate.
- Factory-side kits (`gearKit`/`shellKit`) may reference **internal** (`#`)
  namespaces; the consumer kits may not (compile error).
- Map-form factories hoist kit keys to the top level (`const { fmt } = plugin`);
  list-form factories read them via `$.kit.fmt`. See
  [../patterns/plugin-context.md](../patterns/plugin-context.md).

```ts
RMachine.create({
  shellKit: { fmt: "shell/lib/fmt" }, // → $.kit.fmt inside every shell factory
});
// consumer: const [x, $] = plug.useR(); $.kit.fmt.number(123);
```
