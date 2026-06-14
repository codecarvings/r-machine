⚠️ **WARNING: THIS LIBRARY IS STILL IN DEVELOPMENT** ⚠️

---

<img src="r-machine.logo.svg" width="158px" align="center" alt="R-Machine logo" />

# @r-machine/next — R-Machine for Next.js App Router

[![NPM Version](https://img.shields.io/npm/v/%40r-machine%2Fnext?label=latest)](https://www.npmjs.com/package/@r-machine/next)
[![R-Machine CI status](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml/badge.svg?event=push&branch=main)](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml?query=branch%3Amain)

---

> Part of [R-Machine](https://rmachine.dev) — requires the
> [`r-machine`](https://www.npmjs.com/package/r-machine) core and
> [`@r-machine/react`](https://www.npmjs.com/package/@r-machine/react).

Next.js **App Router** integration for R-Machine. Adds SSR-aware plugs
(`ServerPlug` / `ClientPlug`), locale-aware routing, and a dev import shim for
clean HMR.

## Install

```sh
npm install r-machine @r-machine/react @r-machine/next
npm install -D jiti
# peers: next@^15 || ^16, react@^19
```

> **Install `jiti` too.** It is an _optional_ peer dependency, but **strongly
> recommended**: without it `next dev` falls back to a plain dynamic import and you
> lose reliable HMR for resource modules. `jiti` is dev-only — it has no effect on
> production builds.

## Setup

```ts
// src/r-machine/setup.ts
import { NextAppPathStrategy } from "@r-machine/next/app/path";
import { createNextDevImport } from "@r-machine/next/dev";
import { RMachine, type RMachineLocale } from "r-machine";
import { PathAtlas } from "./path-atlas";
import { ResourceAtlas } from "./resource-atlas";

const devImport = await createNextDevImport(import.meta.url);

const rMachine = RMachine.create({
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  load: (path) =>
    devImport ? devImport(`./${path}`) : import(/* @vite-ignore */ `./${path}`),
  shellKit: { fmt: "shell/lib/fmt" },
  experimental: { outerGear: "on" },
});

export const { InnerGear, BaseGear, OuterGear, Shell, localized } =
  rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";

export const strategy = NextAppPathStrategy.create(rMachine, {
  serverKit: { fmt: "shell/lib/fmt" },
  clientKit: { fmt: "shell/lib/fmt" },
  PathAtlas,
  cookie: "on",
});
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

## Resource families — the full server/client spectrum

The App Router mixes server and client in one component tree. R-Machine encodes
that boundary in the **type system**: a resource's _family_ decides where it may be
consumed, and the compiler enforces it — no runtime guard, no leaked secret. This
is the package that makes the whole spectrum usable, from server-only to reactive
client state.

| Family                            | Where it runs         | Consumed by           | Typical use                                                                                                         |
| --------------------------------- | --------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **`InnerGear`**                   | **Server only**       | `ServerPlug` only     | Secrets, DB access, server actions. Wiring it into `Plug`/`ClientPlug` is a **compile-time error**.                 |
| **`BaseGear`**                    | Server **and** client | any plug              | Shared, stateless logic and config (e.g. a bridge gear)                                                             |
| **`OuterGear`**                   | Client                | `Plug` / `ClientPlug` | Stateful, reactive logic — state, actions, memo cells                                                               |
| **Vertex** (`gear:outer(vertex)`) | Client                | `Plug` / `ClientPlug` | An `OuterGear` with a per-consumer instance; shareable across a subtree via `<VertexFrame>`, and never a dependency |

The differentiator: a server-only `InnerGear` simply **cannot be imported into
client code** — the type error fires at the consumer, before anything ships to the
browser. Most i18n / DI / state libraries leave that boundary to convention.

## Locale routing strategies

Pick one strategy via a subpath import — it decides how the active locale is
resolved from each request:

| Import                       | Locale source                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `@r-machine/next/app/path`   | URL path segment (`/en/…`, `/it/…`), with `declarePathAtlas` for translated paths |
| `@r-machine/next/app/flat`   | Cookie (no locale in the URL)                                                     |
| `@r-machine/next/app/origin` | Origin / domain (e.g. `example.com` vs `example.it`)                              |

`@r-machine/next/dev` exports `createNextDevImport`, a [jiti](https://github.com/unjs/jiti)-based
loader that keeps resource modules hot-reloading correctly under `next dev`.

## Documentation

→ Full reference: [`llms-full.txt`](https://rmachine.dev/llms-full.txt) · runnable
example
[`examples/next`](https://github.com/codecarvings/r-machine/tree/main/examples/next)
plus the `next-with-app-*` routing-strategy variants in
[`examples/`](https://github.com/codecarvings/r-machine/tree/main/examples).

---

## License

`@r-machine/next` is licensed under the
[GNU Affero General Public License v3.0](./LICENSE) (AGPL-3.0-only).

This means:

- ✅ Free to use in open source projects with a compatible license
- ✅ Free to modify and distribute under the same terms
- ❌ **Cannot** be used in closed-source / proprietary software

> If you need to use `@r-machine/next` in a proprietary project,
> reach out at licensing@codecarvings.com to discuss a commercial arrangement.
