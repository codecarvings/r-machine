# Path strategy without a proxy — R-Machine × Next.js locale routing

One R-Machine app on the Next.js App Router, served under the **path** locale
strategy **without a proxy middleware**: the locale lives in the **URL segment**
(`/en`, `/it-it`), but instead of `proxy.ts` the root redirect is handled by an
App Router **route handler**. Visiting `/` redirects to the locale detected from
the cookie (if present) or the `Accept-Language` header.

This is a **lean, routing-focused** example. For the full guided tour of every
R-Machine primitive (InnerGear, OuterGear, Vertex, mockPlug, …) see
[`examples/next`](../next). Here the only gear is a small timer — just enough to
show that client state behaves correctly across locale navigation.

It is one of four sibling examples, identical except for the routing strategy:
[path](../next-with-app-path-strategy) · [origin](../next-with-app-origin-strategy) ·
[flat](../next-with-app-flat-strategy) · [**path (no proxy)**](.).

> This variant uses the locale code `it-IT` (URL `/it-it`) to show a non-trivial
> region subtag.

## What it demonstrates

| Topic | Where | What it shows |
| --- | --- | --- |
| **Path strategy, no proxy** | [`setup.ts`](src/r-machine/setup.ts) | `NextAppPathStrategy.create(...)` with `autoDetectLocale: "off"` and **no** `proxy.ts`. |
| **Root redirect via route handler** | [`app/route.ts`](src/app/route.ts) | `routeHandlers.entrance` redirects `/` to the detected locale (cookie → `Accept-Language`) instead of a middleware. |
| **Untranslated paths** | [`path-atlas.ts`](src/r-machine/path-atlas.ts) | No path translation: `/en/example-static/page-1` and `/it-it/example-static/page-1` share the same segments. |
| **Localized + non-localized routes** | [`app/[locale]`](src/app/[locale]) + [`app/(non-localized)`](<src/app/(non-localized)>) | Locale-prefixed pages alongside routes that never get a prefix (`/hello-world`, `/set-italian`). |
| **Locale binding** | [`app/[locale]/page.tsx`](src/app/[locale]/page.tsx), [`layout.tsx`](src/app/[locale]/layout.tsx) | `bindLocale(params)` / `ServerPlug.useR(params)` bind the request locale before server components read resources. |
| **Locale switch (UI)** | [`locale-switcher.tsx`](src/components/client/locale-switcher.tsx) | `$.setLocale("it-IT")` navigates to `/it-it`. |
| **OuterGear (the one gear)** | [`outer/timer`](src/r-machine/pub/outer/timer.ts) | The interval and its `Symbol.dispose` cleanup live in the gear, not the component. |
| **BaseGear** | [`base/config`](src/r-machine/pub/base/config.ts) | App config the timer depends on; also carries the `strategyName` shown in the hero badge. |
| **Mono shell (formatters)** | [`shell/lib/fmt`](src/r-machine/pub/shell/lib/fmt.ts) | Per-locale `Intl` formatters (`en`, `it-IT`); the timer card renders a locale-aware plural ("5 seconds" / "5 secondi"). |
| **Localized shells** | [`shell/*`](src/r-machine/pub/shell) | UI content in `en` + `it-IT`, authored as typed objects with `localized(...)` for the non-default locale. |

## Run it

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

(From the monorepo root: `pnpm --filter @r-machine/examples-next-with-app-path-strategy-no-proxy <script>`.)

## Layout

- `src/r-machine/` — R-Machine resources (`base/config`, `outer/timer`, shells),
  plus `setup.ts`, `resource-atlas.ts`, `path-atlas.ts`, and the client/server toolsets.
- `src/app/[locale]/` — landing, `example-static/*`, and `example-dynamic/*` routes.
- `src/app/(non-localized)/` — routes served without a locale prefix.
- `src/app/route.ts` — root route handler that redirects to the detected locale (replaces `proxy.ts`).
- `src/components/` — `client/*` (plug consumers: timer card, route playground, nav, switcher) and `server/*`.
