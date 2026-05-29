> # ⚠️ New API preview — diverges from `main`
>
> This branch (`RM-alpha-12`) ships a **completely reshaped** R-Machine public API. It is **not** API-compatible with the version currently published from the `main` branch. The new design unifies **i18n, dependency injection and state management around a single declaration syntax**, a single consumer primitive (`Plug`), and a single testing primitive (`mockPlug`).
>
> 📖 **LLM-ready documentation**: [`llms-full.txt`](https://rmachine.dev/llms-full.txt).
>
> 💡 **Tip**: ask your LLM of choice to describe the new R-Machine API — the full specification is available at <https://rmachine.dev> — and to contrast it with mainstream i18n / DI / state libraries. The design choices are easier to appreciate side-by-side.

---

<img src="r-machine.logo.svg" width="158px" align="center" alt="R-Machine logo" />

# R-Machine — Uniformity Under Change for TypeScript

Monorepo containing the R-Machine packages.

[![NPM Version](https://img.shields.io/npm/v/r-machine?label=latest)](https://www.npmjs.com/package/r-machine)
[![R-Machine CI status](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml/badge.svg?event=push&branch=main)](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml?query=branch%3Amain)

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`r-machine`](./packages/r-machine) | [![npm](https://img.shields.io/npm/v/r-machine)](https://www.npmjs.com/package/r-machine) | Core library |
| [`@r-machine/react`](./packages/r-machine-react) | [![npm](https://img.shields.io/npm/v/@r-machine/react)](https://www.npmjs.com/package/@r-machine/react) | React integration |
| [`@r-machine/next`](./packages/r-machine-next) | [![npm](https://img.shields.io/npm/v/@r-machine/next)](https://www.npmjs.com/package/@r-machine/next) | Next.js App Router integration |
| [`@r-machine/testing`](./packages/r-machine-testing) | [![npm](https://img.shields.io/npm/v/@r-machine/testing)](https://www.npmjs.com/package/@r-machine/testing) | Testing utilities |
| [`rforge`](./packages/rforge) | [![npm](https://img.shields.io/npm/v/rforge)](https://www.npmjs.com/package/rforge) | Command-line interface for R-Machine |

## Core concepts at a glance

### Shell — locale-aware content

A `Shell` is a multi-locale resource: one canonical file per locale, exact-keyed type validation across variants.

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

A `Gear` is a stateful or stateless logic unit. Three flavors (`InnerGear`, `BaseGear`, `OuterGear`) differ only in scope and who can consume them (server side / client side). A stateful example:

```ts
// r-machine/outer/counter.ts
import { OuterGear, type RShape } from "@/r-machine/setup";

export const r = OuterGear.withState({ count: 0 }).define(({ $ }, _) => ({
  count: _.getter(() => $.state.count),
  inc:   _.action(() => ({ count: $.state.count + 1 })),
}));

export type Outer_Counter = RShape<typeof r>;
```

### Plug — the one consumer primitive

Components reach any resource through `Plug` (or `ClientPlug` / `ServerPlug` for SSR). Same call shape for gears, shells, single or many:

```tsx
// components/my-component.tsx
import { Plug } from "@/r-machine/toolset";
import { Button } from "/ui/button";

export const plug = Plug("outer/counter", "shell/common");

export default function MyComponent() {
  const [counter, shell] = plug.useR();
  return (
    <div>
      <h1>{counter.count}</h1>
      <Button onClick={counter.inc}>{shell.addButton}</Button>
    </div>
  );
}
```

For tests, `mockPlug(r.plug).with({ ... })` is the **single** override primitive — uniform across gears, shells and vertex resources.

→ Full reference, including `BaseGear`, vertex layout, cursor primitives, framework strategies and testing: [`llms-full.txt`](https://rmachine.dev/llms-full.txt).

## Examples

The [`examples/`](./examples) directory contains working applications:

| Example | Description |
|---------|-------------|
| [`next`](./examples/next) | Next.js App Router |
| [`next-with-app-flat-strategy`](./examples/next-with-app-flat-strategy) | Next.js App Router with cookie-based locale detection |
| [`next-with-app-origin-strategy`](./examples/next-with-app-origin-strategy) | Next.js App Router with origin-based routing |
| [`next-with-app-path-strategy`](./examples/next-with-app-path-strategy) | Next.js App Router with path segment routing |
| [`next-with-app-path-strategy-no-proxy`](./examples/next-with-app-path-strategy-no-proxy) | Path strategy without proxy |
| [`react`](./examples/react) | React + Vite |

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
