# Flat strategy — R-Machine × Next.js locale routing

One R-Machine app on the Next.js App Router, served under the **flat** locale
strategy: the locale lives **outside the URL** — it is resolved from a cookie /
request context, and the URL stays the same for every locale (`/example-static/page-1`
in both English and Italian).

This is a **lean, routing-focused** example. For the full guided tour of every
R-Machine primitive (InnerGear, OuterGear, Vertex, mockPlug, …) see
[`examples/next`](../next). Here the only gear is a small timer — just enough to
show that client state behaves correctly across locale navigation.

It is one of four sibling examples, identical except for the routing strategy:
[path](../next-with-app-path-strategy) · [origin](../next-with-app-origin-strategy) ·
[**flat**](.) · [path (no proxy)](../next-with-app-path-strategy-no-proxy).

## What it demonstrates

| Topic | Where | What it shows |
| --- | --- | --- |
| **Flat strategy setup** | [`setup.ts`](src/r-machine/setup.ts) | `NextAppFlatStrategy.create(...)` with a `pathMatcher` — no locale segment in the URL. |
| **Flat URLs (no prefix)** | [`path-atlas.ts`](src/r-machine/path-atlas.ts) | No path translation: every locale shares the same path segments. |
| **Cookie-driven locale** | [`app/(non-localized)/set-italian/route.ts`](<src/app/(non-localized)/set-italian/route.ts>) | `setLocale(...)` writes the locale cookie; subsequent requests render in that locale with no URL change. |
| **Middleware** | [`proxy.ts`](src/proxy.ts) | `rMachineProxy` resolves the locale from the cookie / context. |
| **Localized + non-localized routes** | [`app/[locale]`](src/app/[locale]) + [`app/(non-localized)`](<src/app/(non-localized)>) | Localized pages alongside routes like `/hello-world` and `/set-italian`. |
| **Locale binding** | [`app/[locale]/page.tsx`](src/app/[locale]/page.tsx), [`layout.tsx`](src/app/[locale]/layout.tsx) | `bindLocale(params)` / `ServerPlug.useR(params)` bind the request locale before server components read resources. |
| **Locale switch (UI)** | [`locale-switcher.tsx`](src/components/client/locale-switcher.tsx) | `$.setLocale(...)` re-renders the same URL in the new locale. |
| **OuterGear (the one gear)** | [`outer/timer`](src/r-machine/pub/outer/timer.ts) | The interval and its `Symbol.dispose` cleanup live in the gear, not the component. |
| **BaseGear** | [`base/config`](src/r-machine/pub/base/config.ts) | App config the timer depends on; also carries the `strategyName` shown in the hero badge. |
| **Mono shell (formatters)** | [`shell/lib/fmt`](src/r-machine/pub/shell/lib/fmt.ts) | Per-locale `Intl` formatters; the timer card renders a locale-aware plural ("5 seconds" / "5 secondi"). |
| **Localized shells** | [`shell/*`](src/r-machine/pub/shell) | UI content in `en` + `it`, authored as typed objects with `localized(...)` for the non-default locale. |

## Run it

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

(From the monorepo root: `pnpm --filter @r-machine/examples-next-with-app-flat-strategy <script>`.)

## Layout

- `src/r-machine/` — R-Machine resources (`base/config`, `outer/timer`, shells),
  plus `setup.ts`, `resource-atlas.ts`, `path-atlas.ts`, and the client/server toolsets.
- `src/app/[locale]/` — landing, `example-static/*`, and `example-dynamic/*` routes.
- `src/app/(non-localized)/` — routes served without a locale prefix.
- `src/components/` — `client/*` (plug consumers: timer card, route playground, nav, switcher) and `server/*`.
- `src/proxy.ts` — the Next.js middleware entry point.
