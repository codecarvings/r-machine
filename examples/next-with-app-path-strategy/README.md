# Path strategy — R-Machine × Next.js locale routing

One R-Machine app on the Next.js App Router, served under the **path** locale
strategy: the locale lives in the **URL segment** (`/en`, `/it`), with the
default locale served implicitly at the root (`/` → English, no redirect).
Change the locale and the path follows — including **translated paths** per
locale (`/en/example-static/page-1` ↔ `/it/esempio-statico/pagina-1`).

This is a **lean, routing-focused** example. For the full guided tour of every
R-Machine primitive (InnerGear, OuterGear, Vertex, mockPlug, …) see
[`examples/next`](../next). Here the only gear is a small timer — just enough to
show that client state behaves correctly across locale navigation.

It is one of four sibling examples, identical except for the routing strategy:
[**path**](.) · [origin](../next-with-app-origin-strategy) ·
[flat](../next-with-app-flat-strategy) ·
[path (no proxy)](../next-with-app-path-strategy-no-proxy).

## What it demonstrates

| Topic | Where | What it shows |
| --- | --- | --- |
| **Path strategy setup** | [`setup.ts`](src/r-machine/setup.ts) | `NextAppPathStrategy.create(...)` with `cookie: "on"` and `implicitDefaultLocale` — the default locale is served at `/` without a prefix. |
| **Translated paths** | [`path-atlas.ts`](src/r-machine/path-atlas.ts) | Per-locale URL segments (`esempio-statico`, `pagina-1`, `page-2-in-english`) declared with `declarePathAtlas`, resolved via `$.getPath(...)`. |
| **Middleware** | [`proxy.ts`](src/proxy.ts) | `rMachineProxy` handles locale detection, the cookie, and the implicit-default-locale rewrite. |
| **Localized + non-localized routes** | [`app/[locale]`](src/app/[locale]) + [`app/(non-localized)`](<src/app/(non-localized)>) | Locale-prefixed pages alongside routes that never get a prefix (`/hello-world`, `/set-italian`). |
| **Locale binding** | [`app/[locale]/page.tsx`](src/app/[locale]/page.tsx), [`layout.tsx`](src/app/[locale]/layout.tsx) | `bindLocale(params)` / `ServerPlug.useR(params)` bind the request locale before server components read resources. |
| **Locale switch (UI)** | [`locale-switcher.tsx`](src/components/client/locale-switcher.tsx) | `$.setLocale(...)` navigates to the same page under the new locale. |
| **OuterGear (the one gear)** | [`outer/timer`](src/r-machine/pub/outer/timer.ts) | The interval and its `Symbol.dispose` cleanup live in the gear, not the component. Tick state survives locale navigation. |
| **BaseGear** | [`base/config`](src/r-machine/pub/base/config.ts) | App config the timer depends on; also carries the `strategyName` shown in the hero badge. |
| **Mono shell (formatters)** | [`shell/lib/fmt`](src/r-machine/pub/shell/lib/fmt.ts) | Per-locale `Intl` formatters; the timer card renders a locale-aware plural ("5 seconds" / "5 secondi"). |
| **Localized shells** | [`shell/*`](src/r-machine/pub/shell) | UI content in `en` + `it`, authored as typed objects with `localized(...)` for the non-default locale. |

## Run it

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

(From the monorepo root: `pnpm --filter @r-machine/examples-next-with-app-path-strategy <script>`.)

## Layout

- `src/r-machine/` — R-Machine resources (`base/config`, `outer/timer`, shells),
  plus `setup.ts`, `resource-atlas.ts`, `path-atlas.ts`, and the client/server toolsets.
- `src/app/[locale]/` — landing, `example-static/*`, and `example-dynamic/*` routes.
- `src/app/(non-localized)/` — routes served without a locale prefix.
- `src/components/` — `client/*` (plug consumers: timer card, route playground, nav, switcher) and `server/*`.
- `src/proxy.ts` — the Next.js middleware entry point.
