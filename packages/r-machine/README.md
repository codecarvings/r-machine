⚠️ **WARNING: THIS LIBRARY IS STILL IN DEVELOPMENT** ⚠️

---

<img src="r-machine.logo.svg" width="158px" align="center" alt="R-Machine logo" />

# r-machine — Uniformity Under Change for TypeScript

[![NPM Version](https://img.shields.io/npm/v/r-machine?label=latest)](https://www.npmjs.com/package/r-machine)
[![R-Machine CI status](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml/badge.svg?event=push&branch=main)](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml?query=branch%3Amain)

---

The **core** of [R-Machine](https://rmachine.dev) — the engine that turns a set of
resource declarations into a single typed access layer. It unifies **i18n,
dependency injection and state management** around one declaration syntax, one
consumer primitive (the `Plug` family), and one testing primitive (`mockPlug`).

You configure the machine once with `RMachine.create(...)` and derive a typed
toolset (`InnerGear`, `BaseGear`, `OuterGear`, `Shell`, `DirectPlug`, `localized`)
from it. `DirectPlug` is the core's built-in, container-free consumer: it resolves
shells and base gears for an explicit locale and runs anywhere — a worker, a CLI, a
cron job — so the core is usable standalone.

> **For reactive consumption from components, pick a framework strategy.** To read
> resources inside React/Next components (Suspense, `$.setLocale`, locale routing),
> pair the core with [`@r-machine/react`](https://www.npmjs.com/package/@r-machine/react)
> or [`@r-machine/next`](https://www.npmjs.com/package/@r-machine/next). A strategy is
> required for that — not to use R-Machine at all.

## Documentation

→ Full reference: [`llms-full.txt`](https://rmachine.dev/llms-full.txt) · working
examples in
[`examples/`](https://github.com/codecarvings/r-machine/tree/main/examples).

## Install

```sh
npm install r-machine
```

## Conceptual model: the namespace as a stable contract

R-Machine is easier to reason about through one model than through a list of
features. A codebase is a dynamic entity: it evolves sprint after sprint, refactor
after refactor, generation after generation. A useful question when evaluating an
architecture is not only _"can it do X?"_ but _"how many files must change when X
evolves?"_ — production files, test files, mocks, fixtures, imports.

R-Machine answers that question the way a DBMS does:

| DBMS concept                      | R-Machine equivalent                                |
| --------------------------------- | --------------------------------------------------- |
| Table name (`customers`)          | Resource namespace (`outer/cart`, `shell/checkout`) |
| Schema (column types)             | TypeScript interface                                |
| Query (`SELECT * FROM customers`) | `Plug(...).useR()`                                  |
| Storage engine, indexes           | Implementation body (gear or shell)                 |

A database table has a stable name that consumers depend on. The storage engine can
be replaced and indexes can change without forcing any consumer to update: the table
name is the contract.

R-Machine applies the same principle to application code. The resource namespace is
the stable contract; the implementation behind it is the volatile layer. Consumers —
including tests, mocks, and fixtures — depend on the namespace, not on where a value
lives or how it is shaped, so a change to the implementation does not propagate to
them.

## Core concepts

Three resource families, and one way to read them.

### Shell — locale-aware content

One canonical file per locale; every variant is exact-key type-checked against the
canonical shape.

```ts
// r-machine/shell/common/en.tsx  (canonical — defines the shape)
import { type RShape } from "@/r-machine/setup";

export const r = { greeting: "Hello", addButton: "Add" };

export type Shell_Common = RShape<typeof r>;
```

```ts
// r-machine/shell/common/it.tsx  (variant — type-checked against canonical)
import { localized } from "@/r-machine/setup";

export const r = localized("shell/common", {
  greeting: "Ciao",
  addButton: "Aggiungi",
});
```

### Gear — logic and state

`InnerGear` / `BaseGear` / `OuterGear` differ only in scope and who can consume
them (server side / client side). A stateful `OuterGear`:

```ts
// r-machine/outer/counter.ts
import { OuterGear, type RShape } from "@/r-machine/setup";

export const r = OuterGear.withDeps("base/config") // a BaseGear dependency
  .withState({ count: 0 }) // the initial state
  .define((plugin, _) => {
    const [config, $] = plugin;
    return {
      count: _.getter(() => $.state.count),
      inc: _.action(() => ({ count: $.state.count + config.incValue })),
    };
  });

export type Outer_Counter = RShape<typeof r>;
```

### Plug — the one consumer primitive

Every component reads resources through `Plug` — same call shape for gears, shells,
one or many:

```tsx
// components/my-component.tsx
import { Plug } from "@/r-machine/toolset";

const plug = Plug("outer/counter", "shell/common");
export default function MyComponent() {
  const [counter, shell] = plug.useR();

  return (
    <button onClick={counter.inc}>
      {shell.addButton} ({counter.count})
    </button>
  );
}
MyComponent.plug = plug; // attached to the consumer for testing purposes with mockPlug
```

> `Plug` above comes from a framework strategy. The core itself also ships
> **`DirectPlug`** — the same `[value, $]` shape, but container-free and `async`
> (`await plug.useR(locale)`). Use it to consume shells and base gears **outside a
> component tree** (workers, CLIs, cron jobs, email templates), with no strategy.

## Setup

How you wire R-Machine into an app depends on the framework. Most of the structure
is shared; a few pieces are specific to the framework and the locale-routing
strategy you pick. Follow the package guide for your stack:

- **React (Vite / SPA)** → [`@r-machine/react`](https://www.npmjs.com/package/@r-machine/react)
- **Next.js (App Router)** → [`@r-machine/next`](https://www.npmjs.com/package/@r-machine/next)

In both cases an R-Machine project lives in **one folder** (conventionally
`src/r-machine/`): a few wiring files, plus one subfolder per resource family.

The common pieces:

| File / folder                         | Role                                                                                                                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setup.ts`                            | Creates the machine and the locale-routing **strategy**; exports the producer toolset used to _declare_ resources                                                       |
| `resource-atlas.ts`                   | The **registry**: maps each folder to a resource family and registers every resource namespace against its type                                                         |
| `toolset.ts`, …                       | Derives the typed **consumer tools** (`Plug`, the provider, `<VertexFrame>`, …) you use across the app. Next splits this into `server-toolset.ts` + `client-toolset.ts` |
| `path-atlas.ts`                       | _(Next only)_ the route map — typed `href` helpers, plus localized URL segments for the path / origin strategies                                                        |
| `base/` `outer/` `vertex/` `shell/` … | Your resources, one subfolder per family. `inner/` (server-only gears) applies to Next server components only                                                           |

→ Full, copy-pasteable setup lives in the package READMEs linked above.

**Without a framework** you don't need a strategy at all — the `r-machine` core
alone (no `@r-machine/react` / `@r-machine/next`). Call `RMachine.create(...)` and
consume resources through `DirectPlug`, passing the locale explicitly to
`useR(locale)` — ideal for workers, cron jobs, scripts, or React Email. Setup
collapses to `setup.ts` + `resource-atlas.ts` (no provider, `toolset.ts`, or
`path-atlas.ts`). See the [`standalone` example](https://github.com/codecarvings/r-machine/tree/main/examples/standalone).

---

## License

`r-machine` is licensed under the
[GNU Affero General Public License v3.0](./LICENSE) (AGPL-3.0-only).

This means:

- ✅ Free to use in open source projects with a compatible license
- ✅ Free to modify and distribute under the same terms
- ❌ **Cannot** be used in closed-source / proprietary software

> If you need to use `r-machine` in a proprietary project,
> reach out at licensing@codecarvings.com to discuss a commercial arrangement.
