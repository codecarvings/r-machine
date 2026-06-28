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

## Documentation

→ Full reference: [`llms-full.txt`](https://rmachine.dev/llms-full.txt) · runnable
example:
[`examples/react`](https://github.com/codecarvings/r-machine/tree/main/examples/react).

## Install

```sh
npm install r-machine @r-machine/react
# peer dependency: react@^19
```

## Setup

An R-Machine project lives in **one folder** — conventionally `src/r-machine/`.
Three wiring files bootstrap the machine; everything else is your resources, with
**one subfolder per family**:

```
src/r-machine/
├── setup.ts            # creates the machine + strategy; exports the producer toolset; imports ./pub/loader
├── toolset.ts          # derives the consumer toolset (Plug, VertexFrame, provider)
├── resource-atlas.ts   # layout map (folder → family) + the typed resource registry
├── vite-plugin-r-machine-hmr.ts   # (Vite dev) HMR plugin — see "HMR with Vite" below
│
└── pub/                # resources (a Vite SPA has no server boundary — all client-safe)
    ├── loader.ts       # registers the loader (register(["*"], …))
    ├── base/           # BaseGear resources
    ├── outer/          # OuterGear resources
    ├── vertex/         # vertex gears
    └── shell/          # locale-aware content - shell
        └── lib/        # single-file shell - shell(mono)
```

### `resource-atlas.ts` — the registry

The heart of the boilerplate. It maps each folder to a resource **family** and
registers every resource namespace against its exported type. This is the one file
you touch when adding or removing a resource — the
[`r-machine`](https://www.npmjs.com/package/r-machine) skill can scaffold both the
resource file and this entry for you:

```ts
// src/r-machine/resource-atlas.ts
import { defineLayout } from "r-machine";
import type { Shell_Lib_Fmt } from "./pub/shell/lib/fmt";

// 1. Map each folder to a resource family.
const folders = defineLayout({
  "base/": "gear:base",
  "outer/": "gear:outer",
  "vertex/": "gear:outer(vertex)",
  "shell/": "shell",
  "shell/lib/": "shell(mono)", // single-file shell — no per-locale variants
});

// 2. Register every resource namespace → its exported type.
type ResourceMap = {
  "shell/lib/fmt": Shell_Lib_Fmt;
};

export class ResourceAtlas extends folders<ResourceMap>() {}

// 3. (optional) Typed dependency tokens for type-safe `.withDeps(...)`.
const token = ResourceAtlas.getTokenBuilder();
export const fmt = token("shell/lib/fmt");
```

### `setup.ts` — the machine + producer toolset

Creates the machine from the atlas and derives the **producer** toolset
(`OuterGear`, `BaseGear`, `Shell`, …) you use to _declare_ resources, then creates
the React strategy:

```ts
// src/r-machine/setup.ts
import { ReactStandardStrategy } from "@r-machine/react";
import { RMachine, type RMachineLocale } from "r-machine";
import { ResourceAtlas } from "./resource-atlas";
import "./pub/loader"; // registers the loader

const rMachine = RMachine.create({
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  shellKit: { fmt: "shell/lib/fmt" },
  experimental: { outerGear: "on" },
});

export const { BaseGear, OuterGear, Shell, DirectPlug, localized } =
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

### `pub/loader.ts` — the resource loader

Resource modules live under `pub/`, and the loader lives alongside them so its
`import.meta.glob` is rooted at that folder. A Vite SPA has no server bundle
boundary, so a single catch-all (`["*"]`) loader covers every prefix:

```ts
// src/r-machine/pub/loader.ts
import type { AnyResModule } from "r-machine/core";
import { ResourceAtlas } from "../resource-atlas";

// Vite statically analyses this glob (rooted at pub/) for code splitting.
const moduleLoaders = import.meta.glob<AnyResModule>("./**/*.{tsx,ts}", {});

ResourceAtlas.loader.register(["*"], async (path) => {
  const resolved = moduleLoaders[`./${path}.tsx`]
    ? `./${path}.tsx`
    : `./${path}.ts`;
  return moduleLoaders[resolved]!();
});
```

See `examples/react` for the full HMR-aware loader.

### `toolset.ts` — the consumer toolset

Derives the **consumer** toolset from the strategy: `Plug` to read resources,
`<VertexFrame>` to scope vertex instances, and `<ReactRMachine>` — the provider you
wrap your app in:

```ts
// src/r-machine/toolset.ts
import { strategy } from "./setup";

export const { ReactRMachine, Plug, VertexFrame } =
  await strategy.createToolset();
```

### Wrap your app

Wrap the app in `<ReactRMachine>`. Because resources resolve asynchronously, the
provider takes a `fallback` shown while the first resources load (it's backed by
Suspense):

```tsx
// src/App.tsx
import { ReactRMachine } from "@/r-machine/toolset";
import { AppShell } from "./components/app-shell";
import ContentLoading from "./components/content-loading";

export default function App() {
  return (
    <ReactRMachine fallback={<ContentLoading />}>
      <AppShell />
    </ReactRMachine>
  );
}
```

Inside the tree, read resources from any component with `Plug(...).useR()`.

## Usage

Declare a `Shell` — one file per locale. The canonical file fixes the shape; each
variant is type-checked against it:

```tsx
// src/r-machine/pub/shell/greeting/en.tsx — canonical (defines the shape)
import { type RShape } from "@/r-machine/setup";

export const r = { hello: "Hello", cta: "Get started" };
export type Shell_Greeting = RShape<typeof r>;
```

```tsx
// src/r-machine/pub/shell/greeting/it.tsx — variant (type-checked against canonical)
import { localized } from "@/r-machine/setup";

export const r = localized("shell/greeting", { hello: "Ciao", cta: "Inizia" });
```

Register it in `resource-atlas.ts` (`"shell/greeting": Shell_Greeting`), then read
it from any component with `Plug` — locale resolution is automatic:

```tsx
// src/components/greeting.tsx
import { Plug } from "@/r-machine/toolset";

const plug = Plug("shell/greeting");
export function Greeting() {
  const [s] = plug.useR();

  return (
    <button>
      {s.hello} — {s.cta}
    </button>
  );
}
Greeting.plug = plug; // attached to the consumer for testing purposes with mockPlug
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

## Resource families

In a React (client-only) app you build with three gear families plus locale-aware
shells. They share one declaration syntax and one consumer primitive (`Plug`), and
differ only in scope and lifetime:

| Family                            | What it is                              | Typical use                                                       |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------- |
| **`BaseGear`**                    | Static, stateless logic & config        | Shared constants, derived config, helpers wired as deps           |
| **`OuterGear`**                   | Stateful, reactive logic                | Component / app state — state, actions, memo cells                |
| **Vertex** (`gear:outer(vertex)`) | An `OuterGear` instanced _per consumer_ | Isolated-by-default widgets, shared on demand via `<VertexFrame>` |
| **`Shell`**                       | Multi-locale content                    | Translated strings & locale-aware formatting                      |

> **No `InnerGear` here.** `InnerGear` is **server-only** and consumable solely by
> `ServerPlug` — it exists for the Next.js App Router via
> [`@r-machine/next`](https://www.npmjs.com/package/@r-machine/next). A pure React
> SPA has no server tier, so it doesn't apply.

See the [`r-machine`](https://www.npmjs.com/package/r-machine) core README for the
`Shell` / `Gear` / `Plug` declaration syntax.

## HMR with Vite

R-Machine resources are loaded dynamically (the loader above), so Vite's
default Fast Refresh doesn't know how to hot-reload them — and it certainly can't
tell that editing a shared port or a `lib/` helper _outside_ the `r-machine/`
directory should refresh the resources that transitively depend on it.

The [`react`](https://github.com/codecarvings/r-machine/tree/main/examples/react)
example solves this with a small, self-contained dev plugin,
[`vite-plugin-r-machine-hmr.ts`](https://github.com/codecarvings/r-machine/blob/main/examples/react/src/r-machine/vite-plugin-r-machine-hmr.ts).
On every change it walks Vite's module graph _upward_ from the edited file to find
the resource modules that (transitively) import it, then emits a custom
`r-machine:update` event per resource. Your `setup.ts` listens for it (it needs the
`rMachine` instance) and `pub/loader.ts` re-imports the invalidated module with a
cache-busting query:

```ts
// src/r-machine/setup.ts — after RMachine.create(...)
if (import.meta.hot && !import.meta.env.TEST) {
  import.meta.hot.on("r-machine:update", ({ file }) => {
    rMachine.reloadModule(file);
  });
}
```

```ts
// src/r-machine/pub/loader.ts
import type { AnyResModule } from "r-machine/core";
import { ResourceAtlas } from "../resource-atlas";

const moduleLoaders = import.meta.glob<AnyResModule>("./**/*.{tsx,ts}", {});
const useHMR = import.meta.hot && !import.meta.env.TEST;

ResourceAtlas.loader.register(["*"], async (path) => {
  const modulePathTsx = `./${path}.tsx`;
  const modulePathTs = `./${path}.ts`;
  const resolvedPath = moduleLoaders[modulePathTsx]
    ? modulePathTsx
    : moduleLoaders[modulePathTs]
      ? modulePathTs
      : null;

  if (!resolvedPath) {
    throw new Error(`Module not found: ${path}`);
  }

  if (useHMR) {
    // In dev, ALWAYS import with a cache-busting query so an HMR-invalidated
    // module (and its freshly-bumped transitive deps) is re-fetched.
    const freshUrl = new URL(`${resolvedPath}?t=${Date.now()}`, import.meta.url)
      .href;
    return import(/* @vite-ignore */ freshUrl) as Promise<AnyResModule>;
  }

  return moduleLoaders[resolvedPath]!();
});
```

Register the plugin in `vite.config.ts`, and in dev have the loader
re-import with a cache-busting query (`?t=${Date.now()}`) so freshly-invalidated
modules are actually re-fetched — see the example's `pub/loader.ts` for the full loader.

The plugin is **plain, commented code you own** — copy it and adapt the paths to
your project layout as needed. When you scaffold a Vite project with the
[`rforge`](https://www.npmjs.com/package/rforge) skill, it sets up an analogous
plugin for you.

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
