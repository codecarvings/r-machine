⚠️ **WARNING: THIS LIBRARY IS STILL IN DEVELOPMENT** ⚠️

---

<img src="r-machine.logo.svg" width="158px" align="center" alt="R-Machine logo" />

# R-Machine — Typed Resource Layer for TypeScript

Monorepo containing [`r-machine`](https://www.npmjs.com/package/r-machine), [`@r-machine/react`](https://www.npmjs.com/package/@r-machine/react), [`@r-machine/next`](https://www.npmjs.com/package/@r-machine/next), and [`@r-machine/testing`](https://www.npmjs.com/package/@r-machine/testing).

[![NPM Version](https://img.shields.io/npm/v/r-machine?label=latest)](https://www.npmjs.com/package/r-machine)
[![R-Machine CI status](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml/badge.svg?event=push&branch=main)](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml?query=branch%3Amain)

## Features

- **Type-Safe Resources** — Full TypeScript support with auto-completion and compile-time validation.
- **Dynamic Resource Loading** — Async module loading with per-locale caching, factory functions for context-aware resources, and batch resolution of multiple resource files with a single request.
- **Built-in Formatters** — Define locale-aware formatting functions (dates, numbers, currencies, plurals) and share them across all resource files.
- **Framework Integrations** — First-class support for React (hooks, Suspense) and Next.js (App Router, server/client split, static generation).
- **Flexible Strategies** — Pluggable locale detection, custom locale stores, and multiple routing strategies for Next.js (path-based, origin, flat).

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`r-machine`](./packages/r-machine) | [![npm](https://img.shields.io/npm/v/r-machine)](https://www.npmjs.com/package/r-machine) | Core i18n library |
| [`@r-machine/react`](./packages/r-machine-react) | [![npm](https://img.shields.io/npm/v/@r-machine/react)](https://www.npmjs.com/package/@r-machine/react) | React integration |
| [`@r-machine/next`](./packages/r-machine-next) | [![npm](https://img.shields.io/npm/v/@r-machine/next)](https://www.npmjs.com/package/@r-machine/next) | Next.js App Router integration |
| [`@r-machine/testing`](./packages/r-machine-testing) | [![npm](https://img.shields.io/npm/v/@r-machine/testing)](https://www.npmjs.com/package/@r-machine/testing) | Testing utilities |

## Quick Start

### Installation

```bash
# Core library
pnpm add r-machine

# With React
pnpm add r-machine @r-machine/react

# With Next.js
pnpm add r-machine @r-machine/react @r-machine/next
```

### 1. Define your resources

<strong>Create a folder named `r-machine` with a sub-folder named `resources`.</strong>

Define the first resource for your default locale (**you can even use TSX!**)

```tsx
// r-machine/resources/common/en.tsx
import type { R } from "r-machine";

const r = {
  greeting: "Hello, world!",
  footer: {
    message: <>Built with <strong>R-Machine</strong></>,
  },
};

export default r;
export type R_Common = R<typeof r>;
```

Each translation must adhere to the interface you just defined.

```tsx
// r-machine/resources/common/it.tsx
import type { R_Common } from "./en";

const r: R_Common = {
  greeting: "Ciao, mondo!",
  footer: {
    message: <>Costruito con <strong>R-Machine</strong></>,
  },
};

export default r;
```

Resources can also be **factory functions** that receive a context parameter `R$`, giving access to formatters (see [Define Formatters](#2-define-formatters)):

```tsx
// r-machine/resources/intl_demo/en.tsx
import type { R } from "r-machine";
import type { R$ } from "@/r-machine/setup";

const r = ($: R$) => {
  const { date, currency } = $.fmt;

  return {
    todayCaption: (d: Date) => `Today's date: ${date.long(d)}`,
    price: (amount: number) => (
      <>Total: <strong>{currency(amount)}</strong></>
    ),
  };
};

export default r;
export type R_IntlDemo = R<typeof r>;
```

### 2. Define Formatters

Define locale-aware formatting functions using `FormattersSeed.create`. These formatters are shared across all your resource files via the `R$` context parameter.

```ts
// r-machine/formatters.ts
import { FormattersSeed } from "r-machine";
import type { Locale } from "./setup";

export class Formatters extends FormattersSeed.create((locale: Locale) => {
  const dateLongFmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  const dateShortFmt = new Intl.DateTimeFormat(locale, { dateStyle: "short" });
  const numberFmt = new Intl.NumberFormat(locale);
  const currencyFmt = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: locale === "en" ? "USD" : "EUR",
  });
  const pluralRules = new Intl.PluralRules(locale);

  return {
    date: {
      long: (d: Date) => dateLongFmt.format(d),
      short: (d: Date) => dateShortFmt.format(d),
    },
    number: (n: number) => numberFmt.format(n),
    currency: (n: number) => currencyFmt.format(n),
    plural: (count: number, one: string, other: string) => {
      const rule = pluralRules.select(count);
      return `${count} ${rule === "one" ? one : other}`;
    },
  };
}) {}
```

### 3. Define a Resource Atlas

The Resource Atlas maps namespace names to their resource types:

```ts
// r-machine/resource-atlas.ts
import type { R_Common } from "./resources/common/en";
import type { R_IntlDemo } from "./resources/intl_demo/en";

export type ResourceAtlas = {
  common: R_Common;
  intl_demo: R_IntlDemo;
};
```

### 4. Set up R-Machine with the Builder API

R-Machine uses a **builder pattern** that breaks setup into three steps, allowing each step to export the types needed by the next:

```ts
// r-machine/setup.ts
import { RMachine, type RMachineLocale, type RMachineRCtx } from "r-machine";
import { Formatters } from "./formatters";
import type { ResourceAtlas } from "./resource-atlas";

// Step 1: create a builder with config (locales, defaultLocale, rModuleResolver);
//         export the inferred Locale type for use in the rest of the app
const rMachineBuilder = RMachine.builder({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) =>
    import(`./resources/${namespace}/${locale}`),
});
export type Locale = RMachineLocale<typeof rMachineBuilder>;

// Step 2: extend the builder with custom formatters;
//         export the inferred R$ type (context for the factories in the resource modules)
const rMachineExtBuilder = rMachineBuilder.with({ Formatters });
export type R$ = RMachineRCtx<typeof rMachineExtBuilder>;

// Step 3: create the r-machine instance mapped to the ResourceAtlas type
export const rMachine = rMachineExtBuilder.create<ResourceAtlas>();

export const strategy = ... // R-Machine offers various strategies, see below...
```

### 5. Use with React

```ts
// r-machine/setup.ts
import { RMachine, type RMachineLocale, type RMachineRCtx } from "r-machine";
import { ReactStandardStrategy } from "@r-machine/react";
import { Formatters } from "./formatters";
import type { ResourceAtlas } from "./resource-atlas";

// Step 1: create the builder
const rMachineBuilder = RMachine.builder({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) =>
    import(`./resources/${namespace}/${locale}`),
});
export type Locale = RMachineLocale<typeof rMachineBuilder>;

// Step 2: extend with formatters
const rMachineExtBuilder = rMachineBuilder.with({ Formatters });
export type R$ = RMachineRCtx<typeof rMachineExtBuilder>;

// Step 3: create the instance
export const rMachine = rMachineExtBuilder.create<ResourceAtlas>();

// Step 4: setup the strategy
export const strategy = new ReactStandardStrategy(rMachine, {
  localeDetector: () => rMachine.localeHelper.matchLocales(navigator.languages),
  localeStore: {
    get: () => localStorage.getItem("locale") ?? undefined,
    set: (newLocale) => localStorage.setItem("locale", newLocale),
  },
});
```

Set up the toolset (**the use of these tools in your App will ensure strong type-checking**).

```ts
// r-machine/toolset.ts
import { strategy } from "./setup";

export const { ReactRMachine, useLocale, useSetLocale, useR, useRKit, useFmt } = await strategy.createToolset();
```

Set up the `ReactRMachine` context.

```tsx
// App.tsx
import { ReactRMachine } from "./r-machine/toolset";
import MyComponent from "./MyComponent";

export default function App() {
  return (
    <ReactRMachine>
      <MyComponent />
    </ReactRMachine>
  );
}
```

Use r-machine tools in React components to localize your app.

```tsx
// MyComponent.tsx
import { useR } from "./r-machine/toolset";

export default function MyComponent() {
  const r = useR("common");

  return (
    <div>
      <p>{r.greeting}</p>
    </div>
  );
}
```

### 6. Use with Next.js

R-Machine provides three built-in strategies for Next. The most common is NextAppPathStrategy.

```ts
// r-machine/setup.ts
import { NextAppPathStrategy } from "@r-machine/next/app";
import { RMachine, type RMachineLocale, type RMachineRCtx } from "r-machine";
import { Formatters } from "./formatters";
import type { ResourceAtlas } from "./resource-atlas";

// Step 1: create the builder
const rMachineBuilder = RMachine.builder({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) =>
    import(`./resources/${namespace}/${locale}`),
});
export type Locale = RMachineLocale<typeof rMachineBuilder>;

// Step 2: extend with formatters
const rMachineExtBuilder = rMachineBuilder.with({ Formatters });
export type R$ = RMachineRCtx<typeof rMachineExtBuilder>;

// Step 3: create the instance
export const rMachine = rMachineExtBuilder.create<ResourceAtlas>();

// Step 4: setup the strategy
export const strategy = new NextAppPathStrategy(rMachine, {
  // Custom strategy configuration here...
});
```

Set up the <u>**client**</u> toolset (**the use of these tools in your app will ensure strong type-checking**).

```ts
// r-machine/client-toolset.ts
"use client";

import { strategy } from "./setup";

export const { NextClientRMachine, useLocale, useSetLocale, useR, useRKit, useFmt, usePathComposer } =
  await strategy.createClientToolset();
```

Set up the <u>**server**</u> toolset (**the use of these tools in your app will ensure strong type-checking**).

```ts
// r-machine/server-toolset.ts
import { NextClientRMachine } from "./client-toolset";
import { strategy } from "./setup";

export const {
  rMachineProxy,
  NextServerRMachine,
  generateLocaleStaticParams,
  bindLocale,
  getLocale,
  setLocale,
  pickR,
  pickRKit,
  getFmt,
  getPathComposer,
} = await strategy.createServerToolset(NextClientRMachine);
```

Set up the Next.js Proxy

```ts
// proxy.ts
import { rMachineProxy } from "./r-machine/server-toolset";

export default rMachineProxy;

export const config = {
  // Apply proxy to all routes except:
  // - Common system routes: `/_next`, `/_vercel`, `/api`
  // - Requests ending with a file extension (e.g., `.js`, `.css`, `.png`, etc.)
  matcher: ["/", "/((?!_next|_vercel|api|.*\\..*).*)"],
};
```

<strong>Create a Dynamic Segment folder named `[locale]`.</strong>

Set up the NextRMachine context in the layout file within the `[locale]` folder.

```tsx
// app/[locale]/layout.tsx
import { bindLocale, generateLocaleStaticParams, NextServerRMachine } from "@/r-machine/server-toolset";

// Pre-render the static params for all locales
export const generateStaticParams = generateLocaleStaticParams;
export const dynamicParams = false;

export default async function LocaleLayout({ params, children }: LayoutProps<"/[locale]">) {
  const { locale } = await bindLocale(params);

  return (
    <html lang={locale}>
      <body>
        <NextServerRMachine>
          {children}
        </NextServerRMachine>
      </body>
    </html>
  );
}
```

Each page that has to be localized must be placed within the `[locale]` folder. The function `bindLocale` must be invoked to bind the page to the correct locale.

```tsx
// app/[locale]/page.tsx   (...SAME FOR EACH PAGE...)
import { bindLocale } from "@/r-machine/server-toolset";

export default async function Page({ params }: PageProps<"/[locale]">) {
  // Bind the locale based on the route parameter
  await bindLocale(params);

  return (
    <>
      ...
    </>
  );
}
```

Use r-machine tools in server components to localize your app.

```tsx
// my-server-component.tsx
import { pickR } from "@/r-machine/server-toolset";

export default async function MyServerComponent() {
  const r = await pickR("common");

  return (
    <div>
      <p>{r.greeting}</p>
    </div>
  );
}
```

Use r-machine tools in client components to localize your app.

```tsx
// my-client-component.tsx
"use client";

import { useR } from "@/r-machine/client-toolset";

export default function MyClientComponent() {
  const r = useR("common");

  return (
    <div>
      <p>{r.greeting}</p>
    </div>
  );
}
```

## Core Concepts

### Resource Atlas

A type-level map that associates namespace names with their resource types. This enables full type safety when fetching and using translations.
You can split resources/namespaces into any number of folders and sub-folders.

```ts
type ResourceAtlas = {
  common: R_Common;
  "landing-page": R_LandingPage;
  "features/box_1_2": R_Features_Box_1_2;
};
```

### RMachine

The central engine. It manages configuration, locale matching, and resource resolution with per-locale caching:

```ts
const rMachineBuilder = RMachine.builder({
  locales: ["en", "it", "fr"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) =>
    import(`./resources/${namespace}/${locale}`),
});

const rMachine = rMachineBuilder
  .with({ Formatters })
  .create<ResourceAtlas>();

// Fetch a single namespace
const common = await rMachine.pickR("en", "common");

// Fetch multiple namespaces at once
const [common, landingPage] = await rMachine.pickRKit("en", "common", "landing-page");
```

### Formatters

Locale-aware formatting functions that can be shared across all resource files. Define them once with `FormattersSeed.create` and access them in resource factory functions via `$.fmt`:

```ts
// In resource files:
const r = ($: R$) => {
  const { date, currency } = $.fmt;
  return {
    price: (amount: number) => currency(amount),
  };
};
```

Formatters are also accessible in components via `useFmt()` (client) and `getFmt()` (server).

### Strategies

Strategies define how locale detection, persistence, and routing are handled for a given framework:

- **`ReactStandardStrategy`** — Detects and persists locale on the client with custom detectors and stores
- **`NextAppPathStrategy`** — Locale embedded in path segments: `/en/about`, `/it/about`
- **`NextAppOriginStrategy`** — Locale determined by request origin/domain
- **`NextAppFlatStrategy`** — Locale stored in cookie

## Examples

The [`examples/`](./examples) directory contains working applications:

| Example | Description |
|---------|-------------|
| [`react`](./examples/react) | React + Vite with client-side locale detection |
| [`next-with-app-path-strategy`](./examples/next-with-app-path-strategy) | Next.js App Router with path segment routing |
| [`next-with-app-path-strategy-no-proxy`](./examples/next-with-app-path-strategy-no-proxy) | Path strategy without proxy |
| [`next-with-app-origin-strategy`](./examples/next-with-app-origin-strategy) | Next.js App Router with origin-based routing |
| [`next-with-app-flat-strategy`](./examples/next-with-app-flat-strategy) | Next.js App Router with cookie-based locale detection |

## Monorepo Structure

```
r-machine/
├── packages/
│   ├── r-machine/           # Core library
│   ├── r-machine-react/     # React bindings
│   ├── r-machine-next/      # Next.js integration
│   └── r-machine-testing/   # Testing utilities
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

> All packages are free for open source projects.
> If you need to use them in a proprietary project, reach out at 
> licensing@codecarvings.com to discuss a commercial arrangement.
