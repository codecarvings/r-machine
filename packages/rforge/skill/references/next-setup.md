# R-Machine — Next.js App Router Setup

Use this guide when scaffolding R-Machine from scratch into a Next.js App
Router project. Covers all three routing strategies.

---

## 0. Packages

All three production packages are required, plus one devDependency. Use
whichever package manager the project already uses:

```bash
# pnpm
pnpm add r-machine @r-machine/react @r-machine/next
pnpm add -D @r-machine/testing

# npm
npm install r-machine @r-machine/react @r-machine/next
npm install --save-dev @r-machine/testing

# yarn
yarn add r-machine @r-machine/react @r-machine/next
yarn add --dev @r-machine/testing

# bun
bun add r-machine @r-machine/react @r-machine/next
bun add --dev @r-machine/testing
```

`r-machine` is the core, `@r-machine/react` is used internally by the Next.js
package for React components (`NextServerRMachine`, `NextClientRMachine`,
`VertexFrame`, etc.), `@r-machine/next` provides the strategy and
server/client toolsets, and `@r-machine/testing` provides testing utilities.

---

## 1. Which strategy?

Ask the user before writing any file:

| Strategy                | When to use                                                                    |
| ----------------------- | ------------------------------------------------------------------------------ |
| `NextAppPathStrategy`   | Locale in the URL path (`/en/…`, `/it/…`). Most common.                        |
| `NextAppFlatStrategy`   | Locale in cookie/header, same URL for all locales.                             |
| `NextAppOriginStrategy` | Different subdomain or origin per locale (`en.example.com`, `it.example.com`). |

Also ask:

- **Locales** — e.g. `["en", "it"]`
- **Default locale** — e.g. `"en"`
- **Path strategy only**: proxy or no-proxy variant?
  - **Proxy** (default, recommended): creates `src/proxy.ts`
  - **No-proxy**: creates `app/route.ts` instead; simpler but no middleware
- **Origin strategy only**: the origin map — `{ en: "https://example.com", it: "https://example.it" }`
- **Optional for Path/Origin**: localised URL paths via `PathAtlas`? (creates `path-atlas.ts`)
- **Kit**: does the project need a formatter shell (`shell/lib/fmt`)? Almost always yes.

---

## 2. Files to create

All files live under `src/r-machine/` (or wherever the `@/r-machine/` alias points).

### 2.1 `resource-atlas.ts` (identical for all strategies)

Start with the full layout and an empty `ResourceMap`. Resources are added later.

```ts
// src/r-machine/resource-atlas.ts
import { defineLayout } from "r-machine";

const folders = defineLayout({
  "inner/": "gear:inner",
  "base/": "gear:base",
  "outer/": "gear:outer",
  "vertex/": "gear:outer(vertex)",
  "shell/": "shell",
  "shell/lib/": "shell(mono)",
});

type ResourceMap = {
  // Resources will be added here as they are scaffolded
  // e.g. "outer/cart": Outer_Cart;
};

export class ResourceAtlas extends folders<ResourceMap>() {}
```

Omit families the project won't use (e.g. omit `gear:inner` for client-only apps).
If using `gear:inner`, keep it — removing it later is trivial.

### 2.2 `setup.ts` — strategy-specific

See §3 below for each strategy's variant.

### 2.3 `client-toolset.ts` (identical for all strategies)

```ts
// src/r-machine/client-toolset.ts
"use client";

import { strategy } from "./setup";

export const { NextClientRMachine, ClientPlug, VertexFrame } =
  await strategy.createClientToolset();
```

### 2.4 `server-toolset.ts`

**With proxy** (Path, Flat, Origin strategies — default):

```ts
// src/r-machine/server-toolset.ts
import { NextClientRMachine } from "./client-toolset";
import { strategy } from "./setup";

export const {
  rMachineProxy,
  NextServerRMachine,
  generateLocaleStaticParams,
  bindLocale,
  setLocale,
  ServerPlug,
} = await strategy.createServerToolset(NextClientRMachine);
```

**No-proxy** (Path strategy only — alternative):

```ts
// src/r-machine/server-toolset.ts
import { NextClientRMachine } from "./client-toolset";
import { strategy } from "./setup";

export const {
  routeHandlers,
  NextServerRMachine,
  generateLocaleStaticParams,
  bindLocale,
  setLocale,
  ServerPlug,
} = await strategy.createNoProxyServerToolset(NextClientRMachine);
```

### 2.5 `proxy.ts` (with-proxy strategies only)

Place at the project source root (e.g. `src/proxy.ts`), **not** inside `r-machine/`:

```ts
// src/proxy.ts
import { rMachineProxy } from "./r-machine/server-toolset";

export default rMachineProxy;

export const config = {
  matcher: ["/", "/((?!_next|_vercel|api|.*\\..*).*)"],
};
```

### 2.6 `app/route.ts` (no-proxy Path strategy only)

```ts
// app/route.ts
import { routeHandlers } from "@/r-machine/server-toolset";

// Redirects "/" to the correct locale via cookie or Accept-Language
export const { GET } = routeHandlers.entrance;
```

### 2.7 `path-atlas.ts` (optional — Path and Origin strategies only)

Only create this if the user wants localised URL paths:

```ts
// src/r-machine/path-atlas.ts
import { declarePathAtlas } from "@r-machine/next";
import type { Locale } from "./setup";

export class PathAtlas extends declarePathAtlas<Locale>().as({
  // Add routes as needed, e.g.:
  // "/about": { it: "/chi-siamo" },
}) {}
```

If skipping PathAtlas, remove `PathAtlas` from the strategy options in `setup.ts`.

### 2.8 `app/[locale]/layout.tsx`

Minimal locale layout — adapt the inner HTML to the project's real layout:

```tsx
// app/[locale]/layout.tsx
import {
  generateLocaleStaticParams,
  NextServerRMachine,
  ServerPlug,
} from "@/r-machine/server-toolset";

export const generateStaticParams = generateLocaleStaticParams;
export const dynamicParams = false;

export const plug = ServerPlug(); // no resources yet — just binds locale

export default async function LocaleLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const { $ } = await plug.useR(params); // bind locale
  return (
    <html lang={$.locale}>
      <body>
        <NextServerRMachine>{children}</NextServerRMachine>
      </body>
    </html>
  );
}
```

Once a shell is added (e.g. `shell/common`), replace `ServerPlug()` with
`ServerPlug("shell/common")` and destructure it normally.

---

## 3. `setup.ts` per strategy

### 3.1 `NextAppPathStrategy`

```ts
// src/r-machine/setup.ts
import { NextAppPathStrategy } from "@r-machine/next/app/path";
import { createNextDevImport } from "@r-machine/next/dev";
import { RMachine, type RMachineLocale } from "r-machine";
import { ResourceAtlas } from "./resource-atlas";
// import { PathAtlas } from "./path-atlas"; // uncomment if using PathAtlas

const devImport = await createNextDevImport(import.meta.url);

const rMachine = RMachine.create({
  locales: ["en", "it"] as const, // ← replace with real locales
  defaultLocale: "en", // ← replace with real default
  ResourceAtlas,
  load: (path) => (devImport ? devImport(`./${path}`) : import(`./${path}`)),
  shellKit: {
    fmt: "shell/lib/fmt", // remove if not using a formatter shell
  },
  experimental: {
    outerGear: "on",
  },
});

export const { InnerGear, BaseGear, OuterGear, Shell, localized } =
  rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";

export const strategy = NextAppPathStrategy.create(rMachine, {
  clientKit: { fmt: "shell/lib/fmt" },
  serverKit: { fmt: "shell/lib/fmt" },
  // PathAtlas,                       // uncomment if using PathAtlas
  cookie: "on",
  // implicitDefaultLocale: "on",     // hides default locale prefix from URLs
});

export const { localeHelper, hrefHelper } = strategy.getHelpers();
```

### 3.2 `NextAppFlatStrategy`

```ts
// src/r-machine/setup.ts
import { NextAppFlatStrategy } from "@r-machine/next/app/flat";
import { createNextDevImport } from "@r-machine/next/dev";
import { RMachine, type RMachineLocale } from "r-machine";
import { ResourceAtlas } from "./resource-atlas";

const devImport = await createNextDevImport(import.meta.url);

const rMachine = RMachine.create({
  locales: ["en", "it"] as const,
  defaultLocale: "en",
  ResourceAtlas,
  load: (path) => (devImport ? devImport(`./${path}`) : import(`./${path}`)),
  shellKit: { fmt: "shell/lib/fmt" },
  experimental: { outerGear: "on" },
});

export const { InnerGear, BaseGear, OuterGear, Shell, localized } =
  rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";

export const strategy = NextAppFlatStrategy.create(rMachine, {
  clientKit: { fmt: "shell/lib/fmt" },
  serverKit: { fmt: "shell/lib/fmt" },
  // Flat strategy requires cookie — locale has nowhere else to live
  // cookie: "on",   // uncomment if you want an explicit cookie
});

export const { localeHelper, hrefHelper } = strategy.getHelpers();
```

Note: `NextAppFlatStrategy` **requires** `proxy.ts` — no no-proxy alternative.

### 3.3 `NextAppOriginStrategy`

```ts
// src/r-machine/setup.ts
import { NextAppOriginStrategy } from "@r-machine/next/app/origin";
import { createNextDevImport } from "@r-machine/next/dev";
import { RMachine, type RMachineLocale } from "r-machine";
import { ResourceAtlas } from "./resource-atlas";

const devImport = await createNextDevImport(import.meta.url);

const rMachine = RMachine.create({
  locales: ["en", "it"] as const,
  defaultLocale: "en",
  ResourceAtlas,
  load: (path) => (devImport ? devImport(`./${path}`) : import(`./${path}`)),
  shellKit: { fmt: "shell/lib/fmt" },
  experimental: { outerGear: "on" },
});

export const { InnerGear, BaseGear, OuterGear, Shell, localized } =
  rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";

export const strategy = NextAppOriginStrategy.create(rMachine, {
  clientKit: { fmt: "shell/lib/fmt" },
  serverKit: { fmt: "shell/lib/fmt" },
  localeOriginMap: {
    en: "https://example.com", // ← replace with real origins
    it: "https://example.it",
  },
});

export const { localeHelper, hrefHelper } = strategy.getHelpers();
```

Note: `NextAppOriginStrategy` **requires** `proxy.ts`.

---

## 4. Summary checklist

After generating all files, confirm with the user:

| File                      | Path                  | Required                       |
| ------------------------- | --------------------- | ------------------------------ |
| `resource-atlas.ts`       | `src/r-machine/`      | ✅ always                      |
| `setup.ts`                | `src/r-machine/`      | ✅ always                      |
| `client-toolset.ts`       | `src/r-machine/`      | ✅ always                      |
| `server-toolset.ts`       | `src/r-machine/`      | ✅ always                      |
| `proxy.ts`                | `src/` (project root) | ✅ Path/Flat/Origin with proxy |
| `app/route.ts`            | `app/`                | Path no-proxy only             |
| `path-atlas.ts`           | `src/r-machine/`      | Optional                       |
| `app/[locale]/layout.tsx` | `app/[locale]/`       | ✅ always                      |

Then remind the user: once the config files exist, use the scaffold skill
normally to add `gear:base`, `gear:outer`, `shell`, etc.

**Install command** (use the package manager already in the project):

```bash
pnpm add r-machine @r-machine/react @r-machine/next && pnpm add -D @r-machine/testing          # pnpm
npm install r-machine @r-machine/react @r-machine/next && npm install --save-dev @r-machine/testing # npm
yarn add r-machine @r-machine/react @r-machine/next && yarn add --dev @r-machine/testing        # yarn
bun add r-machine @r-machine/react @r-machine/next && bun add --dev @r-machine/testing          # bun
```

Also remind them that `shell/lib/fmt` is referenced in `shellKit` /
`clientKit` / `serverKit` but does **not** exist yet in `resource-atlas.ts`.
They should scaffold it as the first resource (`shell(mono)` family) or
remove the kit references if they don't need a formatter.
