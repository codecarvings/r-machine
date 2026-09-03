# R-Machine — Next.js advanced features

Load this when a Next.js task goes past basic scaffolding: localized URLs, locale
switching, static params, the proxy choice, dev HMR, SSR hydration, and rendering
trade-offs. Each section is a self-contained slice — grep the heading you need.

---

## PathAtlas and localized URLs

Build localized links/URLs with **`$.getPath`** (on a consumer's `$`) or
**`hrefHelper`** (outside a plug). Declare every localized path once; consumers
compose URLs type-checked across all locales (no string literals, no per-locale `if`).

```ts
// src/r-machine/path-atlas.ts
import { declarePathAtlas } from "@r-machine/next";
import type { Locale } from "./setup";

export class PathAtlas extends declarePathAtlas<Locale>().as({
  "/product": { it: "/prodotti", "/[id]": {} }, // nested dynamic segment
  "/cart": { it: "/carrello" },
}) {}
```

Pass `PathAtlas` to the strategy (Path/Origin). Then build URLs via `$.getPath`:

```tsx
const [nav, $] = plug.useR();                    // ClientPlug (sync) — or `await` for ServerPlug
<Link href={$.getPath("/")}>{nav.home}</Link>
<Link href={$.getPath("/product/[id]", { id: item.id })}>{item.title}</Link>
```

Outside a plug (non-localized context), use the strategy's `hrefHelper`:

```ts
const homeUrl = hrefHelper.getPath(localeHelper.defaultLocale, "/");
```

`$.getPath` is on `ClientPlug` / `ServerPlug` consumers only (not `Plug` / `DirectPlug`).

### Register a new page's route

**Whenever you add a page** at `app/[locale]/<segments>/page.tsx`, **add its
route to `PathAtlas`** — the nesting mirrors the folder structure. Skip this and
`$.getPath` can't compose its link.

Segment keys always start with `/` and mirror Next's routing: static (`/about`),
dynamic (`/[id]`), catch-all (`/[...slug]`), optional catch-all (`/[[...slug]]`).
Dynamic/catch-all segments take no translation — their value is `{}`.

- **Path / Origin** (`declarePathAtlas<Locale>()`): add the route **with its
  per-locale translations**; a dynamic segment is `{}`:

  ```ts
  "/about": { it: "/chi-siamo" },
  "/blog": { it: "/diario", "/[slug]": {} }, // app/[locale]/blog/[slug]/page.tsx
  ```

- **Flat** (`declarePathAtlas()`, no `<Locale>`): the URL is the same for every
  locale, so add the **route key only** — no translations:

  ```ts
  "/about": {},
  "/blog": { "/[slug]": {} },
  ```

---

## Locale binding & switching (`bindLocale` / `setLocale`)

- **Bind** (once per request, in a layout) — from route params or an explicit locale:

  ```ts
  const { locale } = await bindLocale(params); // from `[locale]` route params
  ```

  Nested server components then **inherit** the bound locale — they take no
  `params` and call `plug.useR()` with no arguments (see
  [patterns/consume/server-plug.md](./patterns/consume/server-plug.md)).

- **Switch** (a Server Action / Route Handler, NOT the render path) — validates and
  persists per strategy (cookie / origin redirect):

  ```ts
  // app/(non-localized)/set-italian/route.ts
  export async function GET() {
    await setLocale("it");
  }
  ```

- **Read without binding** (`generateMetadata`, `generateStaticParams`, a route
  handler) — same locale, no request-scoped binding:

  ```ts
  const [s, $] = await metaPlug.useUnboundR(params); // or useUnboundR(locale)
  ```

  Use it wherever the unit _needs_ the locale but does **not** own the render
  tree for the request. `bindLocale` / `useR(params)` are for a page or layout
  only — see the three-call-site table in
  [patterns/consume/server-plug.md](./patterns/consume/server-plug.md).

- From a client component, `$.setLocale("it")` delegates to the same persistence.
  For a **language switcher** UI (resourceless `ClientPlug()` + `$.setLocale`, with
  `"use client"`), see
  [patterns/consume/client-plug.md](./patterns/consume/client-plug.md).

`bindLocale` / `setLocale` come from the server toolset (`strategy.createServerToolset`).

---

## `generateLocaleStaticParams` (SSG of the `[locale]` segment)

Pre-render the `[locale]` segment for every declared locale at build time:

```tsx
export const generateStaticParams = generateLocaleStaticParams;
export const dynamicParams = false;
// → [{ locale: "en" }, { locale: "it" }, …]
```

---

## Proxy vs no-proxy

- **Proxy** (`src/proxy.ts` re-exporting `rMachineProxy`) — **required** for Flat
  and Origin; the middleware detects the locale, redirects, and rewrites so the
  pipeline sees a uniform `[locale]`.
- **No-proxy** (Path strategy only) — locale is already in the URL; declare an
  `app/route.ts` entrance handler instead (`createNoProxyServerToolset` in setup).
  Simpler, no middleware, but only Path.

```ts
// src/proxy.ts
import { rMachineProxy } from "./r-machine/server-toolset";
export default rMachineProxy;
export const config = { matcher: ["/", "/((?!_next|_vercel|api|.*\\..*).*)"] };
```

---

## `createNextDevImport` (dev HMR for resource modules)

Edits to gears/shells propagate without a dev-server restart (jiti loader).
Returns `null` in production, so the loader falls back to a normal `import`:

```ts
// src/r-machine/pub/loader.ts (and the same in prv/loader.ts for the server-only inner/ loader)
import { createNextDevImport } from "@r-machine/next/dev";
const devImport = await createNextDevImport(import.meta.url);
// ResourceAtlas.loader.register(["base/", "shell/", "shell/lib/", "outer/", "vertex/"], (path) =>
//   devImport ? devImport(`./${path}`) : import(/* @vite-ignore */ `./${path}`))
```

---

## SSR hydration of `OuterGear` state

Seed initial state on the server and reuse it on the client by reading a snapshot
through an **isomorphic `"use server"` port**, applied with the no-arg canonical
action `_.action()(...)` in an async factory. The snapshot **must be deterministic
for the request** so the server render and the client hydration match. Full
pattern: the "async factory (SSR-hydration seed)" section of
[patterns/outer.md](./patterns/outer.md).

---

## Rendering trade-offs: `implicitDefaultLocale` / `autoLocaleBinding`

- **`implicitDefaultLocale`** (Path strategy) — default-locale URLs drop the
  prefix (`/page`, not `/en/page`). Requires `cookie` + proxy.
- **`autoLocaleBinding: "on"`** — server components resolve the locale from a
  proxy-set header, so `useR()` takes no params. Trade-off: it opts those routes
  into **dynamic rendering** (no SSG). Default `"off"` keeps routes statically
  optimizable; you bind explicitly with `useR(params)`.
- **`localeCacheControl`** (Path + Flat) — a response whose locale came from the
  cookie cannot say so with `Vary`: Next owns that header on a rewrite and
  overwrites it. So R-Machine marks those responses `private, no-cache` instead,
  the only statement that survives, keeping a shared cache from serving one
  visitor's locale to everybody. Default `"private"`; use `"inherit"` only when
  the cache in front resolves the locale itself — because it runs the proxy
  before its own lookup, or keys on the cookie. It covers the auto-detect branch
  in Path (RSC requests and non-matching paths stay cacheable) and every handled
  path in Flat, where the locale is never in the URL.
