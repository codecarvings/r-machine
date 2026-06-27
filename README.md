⚠️ **WARNING: THIS LIBRARY IS STILL IN DEVELOPMENT** ⚠️

---

<img src="r-machine.logo.svg" width="158px" align="center" alt="R-Machine logo" />

# R-Machine — Uniformity Under Change for TypeScript

Monorepo containing the R-Machine packages.

[![NPM Version](https://img.shields.io/npm/v/r-machine?label=latest)](https://www.npmjs.com/package/r-machine)
[![R-Machine CI status](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml/badge.svg?event=push&branch=main)](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml?query=branch%3Amain)

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`r-machine`](./packages/r-machine) | [![npm](https://img.shields.io/npm/v/r-machine)](https://www.npmjs.com/package/r-machine) | Core library — composers + framework-free `DirectPlug` |
| [`@r-machine/react`](./packages/r-machine-react) | [![npm](https://img.shields.io/npm/v/@r-machine/react)](https://www.npmjs.com/package/@r-machine/react) | React integration |
| [`@r-machine/next`](./packages/r-machine-next) | [![npm](https://img.shields.io/npm/v/@r-machine/next)](https://www.npmjs.com/package/@r-machine/next) | Next.js App Router integration |
| [`@r-machine/testing`](./packages/r-machine-testing) | [![npm](https://img.shields.io/npm/v/@r-machine/testing)](https://www.npmjs.com/package/@r-machine/testing) | Testing utilities |
| [`rforge`](./packages/rforge) | [![npm](https://img.shields.io/npm/v/rforge)](https://www.npmjs.com/package/rforge) | Command-line interface for R-Machine |

## Documentation

→ Full reference: [`llms-full.txt`](https://rmachine.dev/llms-full.txt) · runnable
example [`examples/`](./examples).

| Example | Description |
|---------|-------------|
| [`next`](./examples/next) | Next.js App Router |
| [`next-with-app-flat-strategy`](./examples/next-with-app-flat-strategy) | Next.js App Router with cookie-based locale detection |
| [`next-with-app-origin-strategy`](./examples/next-with-app-origin-strategy) | Next.js App Router with origin-based routing |
| [`next-with-app-path-strategy`](./examples/next-with-app-path-strategy) | Next.js App Router with path segment routing |
| [`next-with-app-path-strategy-no-proxy`](./examples/next-with-app-path-strategy-no-proxy) | Path strategy without proxy |
| [`react`](./examples/react) | React + Vite |
| [`standalone`](./examples/standalone) | Framework-free Node CLI — `r-machine` core via `DirectPlug`, no strategy |

## Conceptual model: the namespace as a stable contract

R-Machine is easier to reason about through one model than through a list of
features. A codebase is a dynamic entity: it evolves sprint after sprint, refactor
after refactor, generation after generation. A useful question when evaluating an
architecture is not only *"can it do X?"* but *"how many files must change when X
evolves?"* — production files, test files, mocks, fixtures, imports.

R-Machine answers that question the way a DBMS does:

| DBMS concept | R-Machine equivalent |
|---|---|
| Table name (`customers`) | Resource namespace (`outer/cart`, `shell/checkout`) |
| Schema (column types) | TypeScript interface |
| Query (`SELECT * FROM customers`) | `Plug(...).useR()` |
| Storage engine, indexes | Implementation body (gear or shell) |

A database table has a stable name that consumers depend on. The storage engine can
be replaced and indexes can change without forcing any consumer to update: the table
name is the contract.

R-Machine applies the same principle to application code. The resource namespace is
the stable contract; the implementation behind it is the volatile layer. Consumers —
including tests, mocks, and fixtures — depend on the namespace, not on where a value
lives or how it is shaped, so a change to the implementation does not propagate to
them.

## Core concepts at a glance

### Shell — locale-aware content

A `Shell` is a multi-locale resource: one canonical file per locale, exact-keyed type validation across variants.

```ts
// r-machine/pub/shell/common/en.tsx  (canonical — defines the shape)
import { type RShape } from "@/r-machine/setup";

export const r = { greeting: "Hello", addButton: "Add" };

export type Shell_Common = RShape<typeof r>;
```
```ts
// r-machine/pub/shell/common/it.tsx  (variant — type-checked against canonical)
import { localized } from "@/r-machine/setup";

export const r = localized("shell/common", {
  greeting: "Ciao",
  addButton: "Aggiungi",
});
```


### Gear — logic and state

A `Gear` is a stateful or stateless logic unit. Three flavors (`InnerGear`, `BaseGear`, `OuterGear`) differ only in scope and who can consume them (server side / client side). A stateful example:

```ts
// r-machine/pub/outer/counter.ts
import { OuterGear, type RShape } from "@/r-machine/setup";

export const r = OuterGear
  .withDeps("base/config")   // A BaseGear dependency
  .withState({ count: 0 })   // The initial state
  .define((plugin, _) => {
    const [ config, $ ] = plugin;
    return {
      count: _.getter(() => $.state.count),
      inc:   _.action(() => ({ count: $.state.count + config.incValue })),
    };
  });

export type Outer_Counter = RShape<typeof r>;
```

### Plug — the one consumer primitive

Components reach any resource through `Plug` (or `ClientPlug` / `ServerPlug` for SSR; `DirectPlug` for container-free use outside any framework — workers, cron, scripts, ...). Same call shape for gears, shells, single or many:

```tsx
// components/my-component.tsx
import { Plug } from "@/r-machine/toolset";
import { Button } from "@/components/ui/button";

const plug = Plug("outer/counter", "shell/common");
export default function MyComponent() {
  const [counter, shell] = plug.useR();

  return (
    <div>
      <h1>{counter.count}</h1>
      <Button onClick={counter.inc}>{shell.addButton}</Button>
    </div>
  );
}
MyComponent.plug = plug; // attached to the consumer for testing purposes with mockPlug
```

For tests, `mockPlug( ... ).with({ ... })` is the **single** override primitive — uniform across gears, shells and consumers.

## Setup

How you wire R-Machine into an app depends on the framework. Most of the structure
is shared; a few pieces are specific to the framework and the locale-routing
strategy you pick. Follow the package guide for your stack:

- **React (Vite / SPA)** → [`@r-machine/react`](./packages/r-machine-react)
- **Next.js (App Router)** → [`@r-machine/next`](./packages/r-machine-next)

In both cases an R-Machine project lives in **one folder** (conventionally
`src/r-machine/`): a few wiring files, plus resources grouped by bundle visibility
into **`pub/`** (client-safe) and **`prv/`** (server-only `inner/`), each with one
subfolder per family and its own `loader.ts`. The `pub/`/`prv/` segment is
filesystem-only — atlas namespaces are unchanged (`base/config`, `inner/catalog`).

The common pieces:

| File / folder | Role |
|---|---|
| `setup.ts` | Creates the machine and the locale-routing **strategy**; exports the producer toolset used to *declare* resources |
| `resource-atlas.ts` | The **registry**: maps each folder to a resource family and registers every resource namespace against its type |
| `toolset.ts`, … | Derives the typed **consumer tools** (`Plug`, the provider, `<VertexFrame>`, …) you use across the app. Next splits this into `server-toolset.ts` + `client-toolset.ts` |
| `path-atlas.ts` | *(Next only)* the route map — typed `href` helpers, plus localized URL segments for the path / origin strategies |
| `pub/`, `prv/` | Your resources, split by bundle visibility: `pub/` holds the client-safe families (`base/` `outer/` `vertex/` `shell/`), `prv/` holds the server-only `inner/` family (Next server components only). Each owns a `loader.ts`. |

→ Full, copy-pasteable setup lives in the package READMEs linked above.

**Without a framework** you don't need a strategy at all: just `r-machine` (no
`@r-machine/react` / `@r-machine/next`). Call `RMachine.create(...)` and consume
resources through `DirectPlug`, passing the locale explicitly to `useR(locale)` —
ideal for workers, cron jobs, scripts, etc... . Setup collapses to
`setup.ts` + `resource-atlas.ts` (no provider, `toolset.ts`, or `path-atlas.ts`).
See [`examples/standalone`](./examples/standalone).

## Monorepo Structure

```
r-machine/
├── packages/
│   ├── r-machine/           # Core library
│   ├── r-machine-react/     # React bindings
│   ├── r-machine-next/      # Next.js integration
│   ├── r-machine-testing/   # Testing utilities
│   └── rforge/              # Command-line interface for R-Machine
├── examples/                # Example applications
├── configs/                 # Shared TypeScript configs
└── scripts/                 # Utility scripts
```

## Development

This project uses **pnpm** as the package manager.

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Format and lint
pnpm check
```

## License

| Package | License |
|---|---|
| `r-machine` | [AGPL-3.0](./LICENSE) |
| `@r-machine/react` | [AGPL-3.0](./LICENSE) |
| `@r-machine/next` | [AGPL-3.0](./LICENSE) |
| `@r-machine/testing` | [AGPL-3.0](./LICENSE) |
| `rforge` | [AGPL-3.0](./LICENSE) |

> All packages are free for open source projects.
> If you need to use them in a proprietary project, reach out at 
> licensing@codecarvings.com to discuss a commercial arrangement.
