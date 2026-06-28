# R-Machine — Next.js App Router Setup

Use this guide when scaffolding R-Machine from scratch into a Next.js App
Router project. Covers all three routing strategies.

---

## 0. Packages

All three production packages are required, plus dev dependencies. Use
whichever package manager the project already uses:

```bash
# pnpm
pnpm add r-machine @r-machine/react @r-machine/next
pnpm add -D @r-machine/testing jiti

# npm
npm install r-machine @r-machine/react @r-machine/next
npm install --save-dev @r-machine/testing jiti

# yarn
yarn add r-machine @r-machine/react @r-machine/next
yarn add --dev @r-machine/testing jiti

# bun
bun add r-machine @r-machine/react @r-machine/next
bun add --dev @r-machine/testing jiti
```

`r-machine` is the core, `@r-machine/react` is used internally by the Next.js
package for React components (`NextServerRMachine`, `NextClientRMachine`,
`VertexFrame`, etc.), `@r-machine/next` provides the strategy and
server/client toolsets, and `@r-machine/testing` provides testing utilities.
`jiti` (^2) is a **dev-only** dependency that `createNextDevImport` uses for
resource HMR under `next dev` — **Next.js only** (not needed for React/standalone).
If `jiti` isn't already present, install it.

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
- **Kit**: does the project need a formatter shell (`shell/lib/fmt`)? Almost always yes.

A **`path-atlas.ts` is created by default for every Next strategy** (all of them
accept a `PathAtlas`) — start it empty and add localized routes later. No need to
ask.

---

## 2. Files to create

All files live under `src/r-machine/` (or wherever the `@/r-machine/` alias points).

### 2.1 `resource-atlas.ts` (identical for all strategies)

Wire the full layout, the formatter the kits reference, and `getTokenBuilder()`.
Add other resources as you scaffold them.

```ts
// src/r-machine/resource-atlas.ts
import { defineLayout } from "r-machine";
import type { Shell_Lib_Fmt } from "./pub/shell/lib/fmt"; // scaffold this file first (A.4 step 3)

const folders = defineLayout({
  "inner/": "gear:inner",
  "base/": "gear:base",
  "outer/": "gear:outer",
  "vertex/": "gear:outer(vertex)",
  "shell/": "shell",
  "shell/lib/": "shell(mono)",
});

type ResourceMap = {
  "shell/lib/fmt": Shell_Lib_Fmt;
  // add more here as you scaffold them, e.g. "outer/cart": Outer_Cart;
};

export class ResourceAtlas extends folders<ResourceMap>() {}

const token = ResourceAtlas.getTokenBuilder();

export const fmt = token("shell/lib/fmt");
```

No formatter? Drop the `fmt` import/entry/token and keep the self-check by
exporting the builder instead:
`export const token = ResourceAtlas.getTokenBuilder();`.

Omit families the project won't use (e.g. omit `gear:inner` for client-only apps).
If using `gear:inner`, keep it — removing it later is trivial.

### 2.2 `pub/loader.ts` + `prv/loader.ts` — the loader split

R-Machine loads resource modules through a per-prefix loader registered on the
atlas (`ResourceAtlas.loader`). Resource modules live under two folders that
mirror their bundle visibility:

- **`pub/`** ("public") holds the **client-safe** families (`base/`, `outer/`,
  `vertex/`, `shell/`, `shell/lib/`) — these may legitimately appear in the
  client bundle.
- **`prv/`** ("private") holds the **server-only** family (`inner/`) — these
  must never reach the client bundle.

The `pub/`/`prv/` segment is **filesystem-only**: atlas namespaces are
unchanged (still `base/config`, `inner/catalog`, etc.) — the segment is absorbed
by where each `loader.ts` sits. Split the loader registration across two files so
server-only code never reaches the client bundle:

- **`pub/loader.ts`** registers the **client-safe** prefixes (`base/`, `shell/`,
  `shell/lib/`, `outer/`, `vertex/`). Its `import()` glob is rooted at `pub/`.
  `setup.ts` imports it via `import "./pub/loader";`.
- **`prv/loader.ts`** registers the **server-only** `inner/` prefix behind
  `import "server-only"`, so its `import()` glob lives in a server-fenced module
  rooted at `prv/` and Webpack/Turbopack never emit `./inner/*` chunks into the
  client build.

Each loader file creates its own `devImport` via
`createNextDevImport(import.meta.url)`.

```ts
// src/r-machine/pub/loader.ts
import { createNextDevImport } from "@r-machine/next/dev";
import { ResourceAtlas } from "@/r-machine/resource-atlas";

const devImport = await createNextDevImport(import.meta.url);

// Client-safe loaders: every family except `inner/`. The glob is rooted at this
// folder (`pub/`), which always contains this file → the bundler context is
// never empty, even before any resource exists.
ResourceAtlas.loader.register(
  ["base/", "shell/", "shell/lib/", "outer/", "vertex/"],
  (path) =>
    devImport ? devImport(`./${path}`) : import(/* @vite-ignore */ `./${path}`),
);
```

```ts
// src/r-machine/prv/loader.ts
import "server-only";
import { createNextDevImport } from "@r-machine/next/dev";
import { ResourceAtlas } from "@/r-machine/resource-atlas";

const devImport = await createNextDevImport(import.meta.url);

// Server-only loaders. Behind `import "server-only"` and rooted at this folder
// (`prv/`), so the `import()` glob over server-only resources never reaches the
// client bundle. Imported for its side effect by server-toolset.ts.
ResourceAtlas.loader.register(["inner/"], (path) =>
  devImport ? devImport(`./${path}`) : import(/* @vite-ignore */ `./${path}`),
);
```

`prv/loader.ts` is imported for its side effect from `server-toolset.ts`
(§2.4) — never from client code. Skip this file (and the `prv/` folder) entirely
if the project has no `inner/` gears; then `pub/loader.ts` can register `["*"]`
as a single catch-all instead.

**Testing note:** because `setup.ts` imports only `pub/loader`, the `inner/`
prefix is unregistered when `verifyResourceAtlas` runs. Pass `prv/loader.ts`
through its `loaders` option, and alias `server-only` to a no-op in the vitest
config (its top-level `import "server-only"` throws outside an RSC bundle). See
[testing.md](./testing.md) for both snippets.

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
import "server-only";
import { NextClientRMachine } from "./client-toolset";
import { strategy } from "./setup";
import "./prv/loader"; // registers the server-only loaders

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
import "server-only";
import { NextClientRMachine } from "./client-toolset";
import { strategy } from "./setup";
import "./prv/loader"; // registers the server-only loaders

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

### 2.7 `path-atlas.ts` (default — every Next strategy)

Create this by default, starting **empty**. All Next strategies accept a
`PathAtlas`; it gives type-safe `$.getPath(...)` URL composition and is where
localized routes go later (see `next-features.md`).

```ts
// src/r-machine/path-atlas.ts
import { declarePathAtlas } from "@r-machine/next";
import type { Locale } from "./setup";

export class PathAtlas extends declarePathAtlas<Locale>().as({
  // Add localized routes as needed, e.g.:
  // "/about": { it: "/chi-siamo" },
}) {}
```

It is wired into `setup.ts` by default (see §3). To localize URLs later, add
entries here — no other change needed.

### 2.8 `app/[locale]/layout.tsx`

> **Migrating an existing app (the create-next-app default).** A fresh Next app
> ships with a root `app/layout.tsx` (fonts, the `globals.css` import, `metadata`)
> and `app/page.tsx`. The locale segment routes everything under `app/[locale]/`,
> so you must relocate them — don't leave a second root:
>
> - **move** `app/page.tsx` → `app/[locale]/page.tsx`;
> - **merge** the root `app/layout.tsx` (fonts, the `globals.css` import,
>   `metadata`) into `app/[locale]/layout.tsx` — it becomes the real root layout,
>   the one that renders `<html>`/`<body>`;
> - **delete** the old root `app/layout.tsx`.
>
> Keep `globals.css` where it is; just move its import into the new layout.

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

const plug = ServerPlug(); // no resources yet — just binds locale
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
LocaleLayout.plug = plug;
```

Once a shell is added (e.g. `shell/common`), replace `ServerPlug()` with
`ServerPlug("shell/common")` and destructure it normally.

---

## 3. `setup.ts` per strategy

### 3.1 `NextAppPathStrategy`

```ts
// src/r-machine/setup.ts
import { NextAppPathStrategy } from "@r-machine/next/app/path";
import { RMachine, type RMachineLocale } from "r-machine";
import { PathAtlas } from "./path-atlas";
import { ResourceAtlas } from "./resource-atlas";
import "./pub/loader"; // registers the client-safe loaders (§2.2)

const rMachine = RMachine.create({
  locales: ["en", "it"] as const, // ← replace with real locales
  defaultLocale: "en", // ← replace with real default
  ResourceAtlas,
  shellKit: {
    fmt: "shell/lib/fmt", // remove if not using a formatter shell
  },
  experimental: {
    outerGear: "on",
  },
});

export const { InnerGear, BaseGear, OuterGear, Shell, DirectPlug, localized } =
  rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";

export const strategy = NextAppPathStrategy.create(rMachine, {
  clientKit: {
    fmt: "shell/lib/fmt", // remove if not using a formatter shell
  },
  serverKit: {
    fmt: "shell/lib/fmt", // remove if not using a formatter shell
  },
  PathAtlas,
  cookie: "on",
  // implicitDefaultLocale: "on",     // hides default locale prefix from URLs
});

export const { localeHelper, hrefHelper } = strategy.getHelpers();
```

> **React Compiler:** do not enable it (`reactCompiler` in `next.config`) for R-Machine apps — R-Machine reactivity is already read-driven, so it adds little benefit. If you must run it in a mixed codebase, set `reactCompiler: "on"` in the strategy config above to avoid stale reads (it adds per-re-render wrapping overhead). See the main docs §10.4.

### 3.2 `NextAppFlatStrategy`

```ts
// src/r-machine/setup.ts
import { NextAppFlatStrategy } from "@r-machine/next/app/flat";
import { RMachine, type RMachineLocale } from "r-machine";
import { PathAtlas } from "./path-atlas";
import { ResourceAtlas } from "./resource-atlas";
import "./pub/loader"; // registers the client-safe loaders (§2.2)

const rMachine = RMachine.create({
  locales: ["en", "it"] as const,
  defaultLocale: "en",
  ResourceAtlas,
  shellKit: {
    fmt: "shell/lib/fmt", // remove if not using a formatter shell
  },
  experimental: { outerGear: "on" },
});

export const { InnerGear, BaseGear, OuterGear, Shell, DirectPlug, localized } =
  rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";

export const strategy = NextAppFlatStrategy.create(rMachine, {
  clientKit: {
    fmt: "shell/lib/fmt", // remove if not using a formatter shell
  },
  serverKit: {
    fmt: "shell/lib/fmt", // remove if not using a formatter shell
  },
  PathAtlas,
});

export const { localeHelper, hrefHelper } = strategy.getHelpers();
```

Note: `NextAppFlatStrategy` **requires** `proxy.ts` — no no-proxy alternative.

### 3.3 `NextAppOriginStrategy`

```ts
// src/r-machine/setup.ts
import { NextAppOriginStrategy } from "@r-machine/next/app/origin";
import { RMachine, type RMachineLocale } from "r-machine";
import { PathAtlas } from "./path-atlas";
import { ResourceAtlas } from "./resource-atlas";
import "./pub/loader"; // registers the client-safe loaders (§2.2)

const rMachine = RMachine.create({
  locales: ["en", "it"] as const,
  defaultLocale: "en",
  ResourceAtlas,
  shellKit: {
    fmt: "shell/lib/fmt", // remove if not using a formatter shell
  },
  experimental: { outerGear: "on" },
});

export const { InnerGear, BaseGear, OuterGear, Shell, DirectPlug, localized } =
  rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";

export const strategy = NextAppOriginStrategy.create(rMachine, {
  clientKit: {
    fmt: "shell/lib/fmt", // remove if not using a formatter shell
  },
  serverKit: {
    fmt: "shell/lib/fmt", // remove if not using a formatter shell
  },
  PathAtlas,
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
| `pub/loader.ts`           | `src/r-machine/pub/`  | ✅ always                      |
| `prv/loader.ts`           | `src/r-machine/prv/`  | ✅ always                      |
| `client-toolset.ts`       | `src/r-machine/`      | ✅ always                      |
| `server-toolset.ts`       | `src/r-machine/`      | ✅ always                      |
| `proxy.ts`                | `src/` (project root) | ✅ Path/Flat/Origin with proxy |
| `app/route.ts`            | `app/`                | Path no-proxy only             |
| `path-atlas.ts`           | `src/r-machine/`      | ✅ always (empty by default)   |
| `app/[locale]/layout.tsx` | `app/[locale]/`       | ✅ always                      |

Then remind the user: once the config files exist, use the scaffold skill
normally to add `gear:base`, `gear:outer`, `shell`, etc.

**Install command** (use the package manager already in the project):

```bash
pnpm add r-machine @r-machine/react @r-machine/next && pnpm add -D @r-machine/testing jiti          # pnpm
npm install r-machine @r-machine/react @r-machine/next && npm install --save-dev @r-machine/testing jiti # npm
yarn add r-machine @r-machine/react @r-machine/next && yarn add --dev @r-machine/testing jiti        # yarn
bun add r-machine @r-machine/react @r-machine/next && bun add --dev @r-machine/testing jiti          # bun
```

**Required before the setup is type-clean.** `shell/lib/fmt` is referenced in
`shellKit` / `clientKit` / `serverKit` but does **not** exist yet in
`resource-atlas.ts` — leaving it points a kit at an unregistered namespace and
the first `tsc` fails with a `never` type. Do ONE of:

- **(recommended)** scaffold `shell/lib/fmt` as the first resource (`shell(mono)`
  family, see `patterns/shell.md`) and register it in `resource-atlas.ts`; or
- remove the `fmt` entries from `shellKit` / `clientKit` / `serverKit`.

Then run the typecheck gate — `tsc --noEmit` must be clean before declaring the
setup done.
