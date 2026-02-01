⚠️ **WARNING: THIS LIBRARY IS STILL IN DEVELOPMENT** ⚠️

---

<br />
<p align="center">
  <img src="r-machine.logo.svg" width="158px" align="center" alt="R-Machine logo" />
  <h1 align="center">R-Machine</h1>
  <p align="center">
    A Type-Safe internationalization (i18n) library
    <br/>
    by <a href="https://codecarvings.com">@turolla</a>
  </p>
</p>
<br/>

<p align="center">
<a href="https://github.com/codecarvings/r-machine/actions/workflows/ci.yml?query=branch%3Amain"><img src="https://github.com/codecarvings/r-machine/actions/workflows/ci.yml/badge.svg?event=push&branch=main" alt="R-Machine CI status" /></a>
<a href="https://github.com/codecarvings/r-machine/blob/main/LICENSE" rel="nofollow"><img src="https://img.shields.io/github/license/codecarvings/r-machine" alt="License"></a>
<a href="https://www.npmjs.com/package/r-machine" rel="nofollow"><img src="https://img.shields.io/npm/dw/r-machine.svg" alt="npm"></a>
</p>
<br/>

## Features

- **Type-Safe Resources** — Full TypeScript support with auto-completion and compile-time validation.
- **Dynamic Resource Loading** — Async module loading with per-locale caching, factory functions for context-aware resources, and batch resolution of multiple resource files with a single request.
- **Framework Integrations** — First-class support for React (hooks, Suspense) and Next.js (App Router, server/client split, static generation).
- **Flexible Strategies** — Pluggable locale detection, custom locale stores, and multiple routing strategies for Next.js (path-based, origin, flat).

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`r-machine`](./packages/r-machine) | [![npm](https://img.shields.io/npm/v/r-machine)](https://www.npmjs.com/package/r-machine) | Core i18n library |
| [`@r-machine/react`](./packages/r-machine-react) | [![npm](https://img.shields.io/npm/v/@r-machine/react)](https://www.npmjs.com/package/@r-machine/react) | React integration |
| [`@r-machine/next`](./packages/r-machine-next) | [![npm](https://img.shields.io/npm/v/@r-machine/next)](https://www.npmjs.com/package/@r-machine/next) | Next.js App Router integration |

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

### 2. Define a Resource Atlas

The Resource Atlas maps namespace names to their resource types:

```ts
// r-machine/resource-atlas.ts
import type { R_Common } from "./resources/common/en";

export type ResourceAtlas = {
  common: R_Common;
};
```

### 3. Create an RMachine instance and set up a Strategy according to your needs

```ts
// r-machine/r-machine.ts
import { RMachine } from "r-machine";
import type { ResourceAtlas } from "./resource-atlas";

export const rMachine = new RMachine<ResourceAtlas>({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) =>
    import(`./resources/${namespace}/${locale}`),
});

export const strategy = ... // R-Machine offers various strategies, see below...
```

### 4. Use with React

```ts
// r-machine/r-machine.ts
import { RMachine } from "r-machine";
import type { ResourceAtlas } from "./resource-atlas";
import { ReactStandardStrategy } from "@r-machine/react";

export const rMachine = new RMachine<ResourceAtlas>({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) =>
    import(`./resources/${namespace}/${locale}`),
});

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
import { strategy } from "./r-machine";

export const { ReactRMachine, useLocale, useSetLocale, useR, useRKit } = await strategy.createToolset();
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

### 5. Use with Next.js

R-Machine provides three built-in strategies for Next. The most common is NextAppPathStrategy.

```ts
// r-machine/r-machine.ts
import { NextAppPathStrategy } from "@r-machine/next/app";
import { RMachine } from "r-machine";
import type { ResourceAtlas } from "./resource-atlas";

export const rMachine = new RMachine<ResourceAtlas>({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) =>
    import(`./resources/${namespace}/${locale}`),
});

export const strategy = new NextAppPathStrategy(rMachine, {
  // Custom strategy configuration here...
});
```

Set up the <u>**server**</u> toolset (**the use of these tools in your app will ensure strong type-checking**).

```ts
// r-machine/server-toolset.ts
import { NextClientRMachine } from "./client-toolset";
import { strategy } from "./r-machine";

export const {
  rMachineProxy,
  NextServerRMachine,
  generateLocaleStaticParams,
  bindLocale,
  getLocale,
  setLocale,
  pickR,
  pickRKit,
  getPathComposer,
} = await strategy.createServerToolset(NextClientRMachine);
```

Set up the <u>**client**</u> toolset (**the use of these tools in your app will ensure strong type-checking**).


```ts
// r-machine/client-toolset.ts
"use client";

import { strategy } from "./r-machine";

export const { NextClientRMachine, useLocale, useSetLocale, useR, useRKit, usePathComposer } =
  await strategy.createClientToolset();
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
import { getR } from "./r-machine/server-toolset";

export default async function MyServerComponent() {
  const r = await getR("common");

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

import { useR } from "./r-machine/client-toolset";

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
const rMachine = new RMachine<ResourceAtlas>({
  locales: ["en", "it", "fr"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) =>
    import(`./resources/${namespace}/${locale}`),
});

// Fetch a single namespace
const common = await rMachine.pickR("en", "common");

// Fetch multiple namespaces at once
const [common, landingPage] = await rMachine.pickRKit("en", "common", "landing-page");
```

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
│   └── r-machine-next/      # Next.js integration
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

[MIT](./LICENSE)
