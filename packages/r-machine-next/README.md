<img src="r-machine.logo.svg" width="100px" align="center" alt="R-Machine logo" />

# @r-machine/next — R-Machine for Next.js App Router

[![NPM Version](https://img.shields.io/npm/v/%40r-machine%2Fnext?label=latest)](https://www.npmjs.com/package/@r-machine/next)
[![R-Machine CI status](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml/badge.svg?event=push&branch=main)](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml?query=branch%3Amain)

_A TypeScript resource layer for React and Next.js_

## Getting started

R-Machine ships an agent skill that scaffolds a project and adds resources. Start from a fresh app and install it:

```bash
npm create next-app@latest my-app
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

From there, just describe a feature in plain words:

```
Add a counter to the home page: a label showing the current value,
and two buttons, "Increase" and "Decrease".
Disable "Decrease" when the value is 0.
```

A step-by-step quickstart is coming on rmachine.dev.

### Packages

|                | Package                                                                  | Description                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|                | [`r-machine`](https://www.npmjs.com/package/r-machine)                   | The core: atlas, composers, plugs. Every project needs it.                                                                                                                                                |
|                | [`@r-machine/react`](https://www.npmjs.com/package/@r-machine/react)     | React integration. Install it in every project that renders React, Next.js included.                                                                                                                      |
| _This package_ | **[`@r-machine/next`](https://www.npmjs.com/package/@r-machine/next)**   | **Next.js App Router on top of the above: three routing models, the locale proxy, path composition.**                                                                                                     |
|                | [`@r-machine/testing`](https://www.npmjs.com/package/@r-machine/testing) | `mockPlug` and `verifyResourceAtlas`. A dev dependency, and the recommended way to test resources. _Warning: this package is still in active development — the API may change before the stable release._ |
|                | [`rforge`](https://www.npmjs.com/package/rforge)                         | Command-line interface for R-Machine                                                                                                                                                                      |

```bash
npm install r-machine @r-machine/react @r-machine/next
npm install -D @r-machine/testing
```

### Documentation

**[`llms-full.txt`](https://rmachine.dev/llms-full.txt)** — the full API reference, written
to be read by an agent. Hand it over and ask what you'd ask a colleague who knows the
library: _"how does `OuterGear` work?"_, _"how would I do X here?"_

Each example below is a working app you can clone and run.

| Example                                                                                                                                     | Description                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`next`](https://github.com/codecarvings/r-machine/tree/main/examples/next)                                                                 | Next.js App Router                                    |
| [`next-with-app-flat-strategy`](https://github.com/codecarvings/r-machine/tree/main/examples/next-with-app-flat-strategy)                   | Next.js App Router with cookie-based locale detection |
| [`next-with-app-origin-strategy`](https://github.com/codecarvings/r-machine/tree/main/examples/next-with-app-origin-strategy)               | Next.js App Router with origin-based routing          |
| [`next-with-app-path-strategy`](https://github.com/codecarvings/r-machine/tree/main/examples/next-with-app-path-strategy)                   | Next.js App Router with path segment routing          |
| [`next-with-app-path-strategy-no-proxy`](https://github.com/codecarvings/r-machine/tree/main/examples/next-with-app-path-strategy-no-proxy) | Path strategy without proxy                           |
| [`react`](https://github.com/codecarvings/r-machine/tree/main/examples/react)                                                               | React + Vite                                          |

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
import { ClientPlug } from "@/r-machine/client-toolset";
import { Button } from "@/components/ui/button";

const plug = ClientPlug("outer/counter", "shell/common");
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

### Testing

For tests, `mockPlug( ... ).with({ ... })` is the **single** override primitive — uniform across gears, shells and consumers.

```ts
// tests/r-machine/pub/outer/counter.test.ts
import { mockPlug } from "@r-machine/testing";
import { describe, expect, it } from "vitest";
import { r } from "@/r-machine/pub/outer/counter";

describe("outer/counter", () => {
  it("starts at 0 and increases", async () => {
    using ctrl = mockPlug(r).with({ 0: { incValue: 1 } }); // base/config mocked
    const counter = await ctrl.createRes();

    expect(counter.count).toBe(0);
    counter.inc();
    expect(counter.count).toBe(1);
  });
});
```
