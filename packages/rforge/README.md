<img src="r-machine.logo.svg" width="100px" align="center" alt="R-Machine logo" />

# rforge — Command-line interface for R-Machine

[![NPM Version](https://img.shields.io/npm/v/rforge?label=latest)](https://www.npmjs.com/package/rforge)
[![R-Machine CI status](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml/badge.svg?event=push&branch=main)](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml?query=branch%3Amain)

_A TypeScript resource layer for React and Next.js_

## Uniformity Under Change

A codebase evolves commit after commit, sprint after sprint, LLM iteration after LLM iteration.

So _can it do X?_ is only half of what's worth asking about an architecture. The other half: _how far does a change travel?_ Move a resource from the server to the client, add a second locale, swap an implementation: count the files you touch. Count how many of them are tests that have nothing to do with what you changed.

In R-Machine logic and state live in a `gear`, content in a `shell`, and a consumer reads a name and the shape behind it. Where the value lives, how it's built, whether it's localized — none of it is visible at the call site, so none of it is something a consumer can depend on. And there is no second way to write that call site: this isn't a pattern you have to remember to follow, it's the only form there is.

<details>
<summary><strong>An agent promoting a global gear to per-instance state — 5 files, 7 insertions</strong></summary>

<img src="https://raw.githubusercontent.com/codecarvings/r-machine/refs/heads/RM-beta-1/.github/assets/outer-to-vertex.png" width="600px" align="center" alt="An agent promoting a global gear to per-instance state: five files changed, seven insertions" />

</details>

## A codebase with a north

A human learns a project over months and carries the map in their head. An agent has no months — it has whatever fits in the window, and then it's gone.

With R-Machine there is no map to keep up to date: the map is the codebase. The resources, the atlas, the dependencies. This holds for any R-Machine project, not just yours: the coordinates are the same everywhere. To an agent, your code might come across as boring in its predictability.

And the same thing that orients an agent is what stops it. A dependency that doesn't match, a mock that no longer fits the shape the app mounts, a translation the new locale forgot: compile errors at the site that caused them. Not a green run and a surprise in production.

## Getting started

Start from a fresh app and install the skill that scaffolds a project and adds resources:

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

|                | Package                                                                  | Description                                                                                        |
| -------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
|                | [`r-machine`](https://www.npmjs.com/package/r-machine)                   | The core: atlas, composers, plugs. Every project needs it.                                         |
|                | [`@r-machine/react`](https://www.npmjs.com/package/@r-machine/react)     | React integration. Install it in every project that renders React, Next.js included.               |
|                | [`@r-machine/next`](https://www.npmjs.com/package/@r-machine/next)       | Next.js App Router on top of the above: three routing models, the locale proxy, path composition.  |
|                | [`@r-machine/testing`](https://www.npmjs.com/package/@r-machine/testing) | `mockPlug` and `verifyResourceAtlas`. A dev dependency, and the recommended way to test resources. |
| _This package_ | **[`rforge`](https://www.npmjs.com/package/rforge)**                     | **Command-line interface for R-Machine**                                                           |

### Documentation

**[`llms-full.txt`](https://rmachine.dev/llms-full.txt)** — the full API reference, written
to be read by an agent. Hand it over and ask what you'd ask a colleague who knows the
library: _"how does `OuterGear` work?"_, _"how would I do X here?"_

Each example below is a working app you can clone and run.

| Example                                                                                                                                     | Description                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`next`](https://github.com/codecarvings/r-machine/tree/main/examples/next)                                                                 | Next.js App Router                                                       |
| [`next-with-app-flat-strategy`](https://github.com/codecarvings/r-machine/tree/main/examples/next-with-app-flat-strategy)                   | Next.js App Router with cookie-based locale detection                    |
| [`next-with-app-origin-strategy`](https://github.com/codecarvings/r-machine/tree/main/examples/next-with-app-origin-strategy)               | Next.js App Router with origin-based routing                             |
| [`next-with-app-path-strategy`](https://github.com/codecarvings/r-machine/tree/main/examples/next-with-app-path-strategy)                   | Next.js App Router with path segment routing                             |
| [`next-with-app-path-strategy-no-proxy`](https://github.com/codecarvings/r-machine/tree/main/examples/next-with-app-path-strategy-no-proxy) | Path strategy without proxy                                              |
| [`react`](https://github.com/codecarvings/r-machine/tree/main/examples/react)                                                               | React + Vite                                                             |
| [`standalone`](https://github.com/codecarvings/r-machine/tree/main/examples/standalone)                                                     | Framework-free Node CLI — `r-machine` core via `DirectPlug`, no strategy |

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

export const r = OuterGear.withDeps("base/config") // A BaseGear dependency
  .withState({ count: 0 }) // The initial state
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

## Usage of rforge

The `rforge` CLI is the companion tool for [R-Machine](https://rmachine.dev) —
it installs the R-Machine agent skill into your project.

```sh
npx rforge@latest <command>
```

### Commands

```sh
rforge --help
rforge --version
rforge skill
```

#### `rforge skill`

Installs the R-Machine **LLM-agent Skill** into your project so AI coding agents
(Claude Code and others) know how to scaffold and extend R-Machine resources
correctly.

```sh
rforge skill [--out <dir>] [--force]
```

| Flag          | Default       | Description                                                                                           |
| ------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| `--out <dir>` | _(see below)_ | Install into a single skills directory instead of the defaults. The Skill lands in `<out>/r-machine`. |
| `--force`     | `false`       | Refresh the Skill even if it is already up to date at the destination.                                |

**Where it installs.** With no `--out`, a first install seeds the Skill into both
`.claude/skills` (Claude Code) and `.agents/skills` (the vendor-neutral location
other agents read), so it is picked up regardless of which tool runs. On a re-run,
only the locations that already have the Skill are updated — a directory you
removed is never re-created. Pass `--out <dir>` to target exactly one directory
(e.g. `rforge skill --out ./.agents/skills` to add a location later).

**Staying current.** Each installed Skill carries a `.rforge-skill.json` manifest,
so a re-run knows whether it is up to date. If the bundled Skill changed (e.g.
after upgrading `rforge`), the command offers to update it; otherwise it reports
that nothing needs doing. Use `--force` to refresh unconditionally.

Commit the installed folder(s) to share the Skill with your team.
