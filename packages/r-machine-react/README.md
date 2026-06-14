⚠️ **WARNING: THIS LIBRARY IS STILL IN DEVELOPMENT** ⚠️

---

<img src="r-machine.logo.svg" width="158px" align="center" alt="R-Machine logo" />

# @r-machine/react — R-Machine for React

[![NPM Version](https://img.shields.io/npm/v/%40r-machine%2Freact?label=latest)](https://www.npmjs.com/package/@r-machine/react)
[![R-Machine CI status](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml/badge.svg?event=push&branch=main)](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml?query=branch%3Amain)

---

> Part of [R-Machine](https://rmachine.dev) — requires the
> [`r-machine`](https://www.npmjs.com/package/r-machine) core.

React (Vite / SPA) integration for R-Machine. Wires the core machine to React via
`ReactStandardStrategy`, giving you a typed `Plug` for components, locale detection
and switching, and `<VertexFrame>` to share a single vertex resource instance
across a subtree of consumers.

## Install

```sh
npm install r-machine @r-machine/react
# peer dependency: react@^19
```

## Setup

Create the machine, then a React strategy from it:

```ts
// src/r-machine/setup.ts
import { ReactStandardStrategy } from "@r-machine/react";
import { RMachine, type RMachineLocale } from "r-machine";
import { ResourceAtlas } from "./resource-atlas";

const rMachine = RMachine.create({
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  // See examples/react for the Vite `import.meta.glob` loader used in production.
  load: (path) => import(/* @vite-ignore */ `./${path}`),
  shellKit: { fmt: "shell/lib/fmt" },
  experimental: { outerGear: "on" },
});

export const { InnerGear, BaseGear, OuterGear, Shell, localized } =
  rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";

export const strategy = ReactStandardStrategy.create(rMachine, {
  kit: { fmt: "shell/lib/fmt" },
  localeDetector: () => rMachine.localeHelper.matchLocales(navigator.languages),
  localeStore: {
    get: () => localStorage.getItem("locale") ?? undefined,
    set: (locale) => localStorage.setItem("locale", locale),
  },
});
```

Then derive the consumer toolset (`Plug`, `VertexFrame`, and the provider) from the
strategy:

```ts
// src/r-machine/toolset.ts
import { strategy } from "./setup";

export const { ReactRMachine, Plug, VertexFrame } =
  await strategy.createToolset();
```

Wrap your app in `<ReactRMachine>` and read resources from any component with
`Plug(...).useR()`.

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

## Resource families

In a React (client-only) app you build with three gear families plus locale-aware
shells. They share one declaration syntax and one consumer primitive (`Plug`), and
differ only in scope and lifetime:

| Family                            | What it is                              | Typical use                                                                   |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| **`BaseGear`**                    | Static, stateless logic & config        | Shared constants, derived config, helpers wired as deps                       |
| **`OuterGear`**                   | Stateful, reactive logic                | Component / app state — state, actions, memo cells                            |
| **Vertex** (`gear:outer(vertex)`) | An `OuterGear` instanced _per consumer_ | Isolated-by-default widgets, shared on demand via `<VertexFrame>` (see below) |
| **`Shell`**                       | Multi-locale content                    | Translated strings & locale-aware formatting                                  |

> **No `InnerGear` here.** `InnerGear` is **server-only** and consumable solely by
> `ServerPlug` — it exists for the Next.js App Router via
> [`@r-machine/next`](https://www.npmjs.com/package/@r-machine/next). A pure React
> SPA has no server tier, so it doesn't apply.

See the [`r-machine`](https://www.npmjs.com/package/r-machine) core README for the
`Shell` / `Gear` / `Plug` declaration syntax.

## Vertex gears & `<VertexFrame>`

A **vertex gear** is an `OuterGear` placed under a vertex layout
(`gear:outer(vertex)`). It flips the default sharing rule: instead of one shared
instance, **every consumer gets its own** — independent state, lifecycle and
reactivity. Two components that plug the same vertex resource are fully isolated:

```tsx
const widgetPlug = Plug("vertex/counter");
function CounterWidget({ label }: { label: string }) {
  const [counter] = widgetPlug.useR();
  return (
    <button onClick={counter.inc}>
      {label}: {counter.count}
    </button>
  );
}

// <CounterWidget label="A" /> and <CounterWidget label="B" /> are SEPARATE counters.
```

To opt _into_ sharing for a subtree, resolve an instance with a parent plug and
hand it to `<VertexFrame>`. Every consumer under the frame reads that one instance:

```tsx
const framePlug = Plug({ counter: "vertex/counter" });
function Group() {
  const { counter } = framePlug.useR();
  return (
    <VertexFrame gear={[counter]}>
      <CounterWidget label="C" />
      <CounterWidget label="D" /> {/* C and D now share one counter */}
    </VertexFrame>
  );
}
```

This _isolated by default, shared on demand_ model — scoped to an arbitrary part of
the React tree rather than a global store or a hand-rolled Context provider — is
hard to express with conventional state libraries.

## HMR with Vite

R-Machine resources are loaded dynamically (the `load` function above), so Vite's
default Fast Refresh doesn't know how to hot-reload them — and it certainly can't
tell that editing a shared port or a `lib/` helper _outside_ the `r-machine/`
directory should refresh the resources that transitively depend on it.

The [`react`](https://github.com/codecarvings/r-machine/tree/main/examples/react)
example solves this with a small, self-contained dev plugin,
[`vite-plugin-r-machine-hmr.ts`](https://github.com/codecarvings/r-machine/blob/main/examples/react/src/r-machine/vite-plugin-r-machine-hmr.ts).
On every change it walks Vite's module graph _upward_ from the edited file to find
the resource modules that (transitively) import it, then emits a custom
`r-machine:update` event per resource. Your `setup.ts` listens for it and re-imports
just those modules:

```ts
// src/r-machine/setup.ts — alongside RMachine.create(...)
if (import.meta.hot) {
  import.meta.hot.on("r-machine:update", ({ file }) => {
    rMachine.reloadModule(file);
  });
}
```

Register the plugin in `vite.config.ts`, and in dev have the `load` function
re-import with a cache-busting query (`?t=${Date.now()}`) so freshly-invalidated
modules are actually re-fetched — see the example's `setup.ts` for the full loader.

The plugin is **plain, commented code you own** — copy it and adapt the paths to
your project layout as needed. When you scaffold a Vite project with the
[`rforge`](https://www.npmjs.com/package/rforge) skill, it sets up an analogous
plugin for you.

## Documentation

→ Full reference: [`llms-full.txt`](https://rmachine.dev/llms-full.txt) · runnable
example:
[`examples/react`](https://github.com/codecarvings/r-machine/tree/main/examples/react).

---

## License

`@r-machine/react` is licensed under the
[GNU Affero General Public License v3.0](./LICENSE) (AGPL-3.0-only).

This means:

- ✅ Free to use in open source projects with a compatible license
- ✅ Free to modify and distribute under the same terms
- ❌ **Cannot** be used in closed-source / proprietary software

> If you need to use `@r-machine/react` in a proprietary project,
> reach out at licensing@codecarvings.com to discuss a commercial arrangement.
