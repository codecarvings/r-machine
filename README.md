<img src="r-machine.logo.svg" width="100px" align="center" alt="R-Machine logo" />

# R-Machine

[![NPM Version](https://img.shields.io/npm/v/r-machine?label=latest)](https://www.npmjs.com/package/r-machine)
[![R-Machine CI status](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml/badge.svg?event=push&branch=main)](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml?query=branch%3Amain)

*A TypeScript resource layer for React and Next.js*

## Uniformity Under Change

A codebase evolves commit after commit, sprint after sprint, LLM iteration after LLM iteration.

So *can it do X?* is only half of what's worth asking about an architecture. The other half: *how far does a change travel?* Move a resource from the server to the client, add a second locale, swap an implementation: count the files you touch. Count how many of them are tests that have nothing to do with what you changed.

In R-Machine logic and state live in a `gear`, content in a `shell`, and a consumer reads a name and the shape behind it. Where the value lives, how it's built, whether it's localized — none of it is visible at the call site, so none of it is something a consumer can depend on. And there is no second way to write that call site: this isn't a pattern you have to remember to follow, it's the only form there is.

<details>
<summary><strong>An agent promoting a global gear to per-instance state — 5 files, 7 insertions</strong></summary>

<img src=".github/assets/outer-to-vertex.png" width="600px" align="center" alt="An agent promoting a global gear to per-instance state: five files changed, seven insertions" />

</details>

## A codebase with a north

A human learns a project over months and carries the map in their head. An agent has no months — it has whatever fits in the window, and then it's gone.

With R-Machine there is no map to keep up to date: the map is the codebase. The resources, the atlas, the dependencies. This holds for any R-Machine project, not just yours: the coordinates are the same everywhere. To an agent, your code might come across as boring in its predictability.

And the same thing that orients an agent is what stops it. A dependency that doesn't match, a mock that no longer fits the shape the app mounts, a translation the new locale forgot: compile errors at the site that caused them. Not a green run and a surprise in production.

## Getting started

R-Machine ships an agent skill that scaffolds a project and adds resources. Start from a fresh app and install it:

```bash
# Next.js
npm create next-app@latest my-app
cd my-app
npx rforge@latest skill
```

```bash
# React + Vite
npm create vite@latest my-app -- --template react-ts
cd my-app
npx rforge@latest skill
```

> Using pnpm, yarn or bun? Replace `npx rforge@latest` with `pnpm dlx rforge@latest`,
> `yarn dlx rforge@latest` or `bunx rforge@latest`. R-Machine itself has no package
> manager preference — the skill installs the packages with whichever one your project uses.

Then prompt your agent:

```
Install R-Machine in this project
```

Then describe a feature in plain words:

```
Add a counter to the home page: a label showing the current value,
and two buttons, "Increase" and "Decrease".
Disable "Decrease" when the value is 0.
```

A step-by-step quickstart is coming on rmachine.dev.

### Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`r-machine`](./packages/r-machine) | [![npm](https://img.shields.io/npm/v/r-machine)](https://www.npmjs.com/package/r-machine) | The core: atlas, composers, plugs. Every project needs it. |
| [`@r-machine/react`](./packages/r-machine-react) | [![npm](https://img.shields.io/npm/v/@r-machine/react)](https://www.npmjs.com/package/@r-machine/react) | React integration. Install it in every project that renders React, Next.js included. |
| [`@r-machine/next`](./packages/r-machine-next) | [![npm](https://img.shields.io/npm/v/@r-machine/next)](https://www.npmjs.com/package/@r-machine/next) | Next.js App Router on top of the above: three routing models, the locale proxy, path composition. |
| [`@r-machine/testing`](./packages/r-machine-testing) | [![npm](https://img.shields.io/npm/v/@r-machine/testing)](https://www.npmjs.com/package/@r-machine/testing) | `mockPlug` and `verifyResourceAtlas`. A dev dependency, and the recommended way to test resources. |
| [`rforge`](./packages/rforge) | [![npm](https://img.shields.io/npm/v/rforge)](https://www.npmjs.com/package/rforge) | Command-line interface for R-Machine |

```bash
# React
npm install r-machine @r-machine/react
npm install -D @r-machine/testing

# Next.js
npm install r-machine @r-machine/react @r-machine/next
npm install -D @r-machine/testing
```

### Documentation

**[`llms-full.txt`](https://rmachine.dev/llms-full.txt)** — the full API reference, written
to be read by an agent. Hand it over and ask what you'd ask a colleague who knows the
library: *"how does `OuterGear` work?"*, *"how would I do X here?"*

Each example below is a working app you can clone and run.

| Example | Description |
|---------|-------------|
| [`next`](./examples/next) | Next.js App Router |
| [`next-with-app-flat-strategy`](./examples/next-with-app-flat-strategy) | Next.js App Router with cookie-based locale detection |
| [`next-with-app-origin-strategy`](./examples/next-with-app-origin-strategy) | Next.js App Router with origin-based routing |
| [`next-with-app-path-strategy`](./examples/next-with-app-path-strategy) | Next.js App Router with path segment routing |
| [`next-with-app-path-strategy-no-proxy`](./examples/next-with-app-path-strategy-no-proxy) | Path strategy without proxy |
| [`react`](./examples/react) | React + Vite |
| [`standalone`](./examples/standalone) | Framework-free Node CLI — `r-machine` core via `DirectPlug`, no strategy |

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
import { Plug } from "@/r-machine/...";
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

Contributing to R-Machine itself requires **pnpm** — the workspace layout depends on it
and the version is pinned in `packageManager`, so `corepack enable` is enough to get it.

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