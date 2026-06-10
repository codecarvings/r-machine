# Origin strategy — R-Machine × Next.js locale routing

One R-Machine app on the Next.js App Router, served under the **origin** locale
strategy: the locale is determined by the **domain** the app is served from
(`english.test` → English, `italiano.test` → Italian). Switch the locale and the
browser navigates to the other origin.

This is a **lean, routing-focused** example. For the full guided tour of every
R-Machine primitive (InnerGear, OuterGear, Vertex, mockPlug, …) see
[`examples/next`](../next). Here the only gear is a small timer — just enough to
show that client state behaves correctly across locale navigation.

It is one of four sibling examples, identical except for the routing strategy:
[path](../next-with-app-path-strategy) · [**origin**](.) ·
[flat](../next-with-app-flat-strategy) ·
[path (no proxy)](../next-with-app-path-strategy-no-proxy).

## What it demonstrates

| Topic | Where | What it shows |
| --- | --- | --- |
| **Origin strategy setup** | [`setup.ts`](src/r-machine/setup.ts) | `NextAppOriginStrategy.create(...)` with a `localeOriginMap` binding each locale to an origin. |
| **Locale by domain** | [`setup.ts`](src/r-machine/setup.ts) | `en → english.test`, `it → italiano.test`; the active locale is resolved from the request host. |
| **Translated paths** | [`path-atlas.ts`](src/r-machine/path-atlas.ts) | Per-locale URL segments (`esempio-statico`, `pagina-1`) declared with `declarePathAtlas`, resolved via `$.getPath(...)`. |
| **Middleware** | [`proxy.ts`](src/proxy.ts) | `rMachineProxy` resolves the locale from the origin and handles the cookie. |
| **Localized + non-localized routes** | [`app/[locale]`](src/app/[locale]) + [`app/(non-localized)`](<src/app/(non-localized)>) | Localized pages alongside routes served on every origin (`/hello-world`, `/set-italian`). |
| **Locale binding** | [`app/[locale]/page.tsx`](src/app/[locale]/page.tsx), [`layout.tsx`](src/app/[locale]/layout.tsx) | `bindLocale(params)` / `ServerPlug.useR(params)` bind the request locale before server components read resources. |
| **Locale switch (UI)** | [`locale-switcher.tsx`](src/components/client/locale-switcher.tsx) | `$.setLocale(...)` navigates to the same page on the other origin. |
| **OuterGear (the one gear)** | [`outer/timer`](src/r-machine/outer/timer.ts) | The interval and its `Symbol.dispose` cleanup live in the gear, not the component. |
| **BaseGear** | [`base/config`](src/r-machine/base/config.ts) | App config the timer depends on; also carries the `strategyName` shown in the hero badge. |
| **Mono shell (formatters)** | [`shell/lib/fmt`](src/r-machine/shell/lib/fmt.ts) | Per-locale `Intl` formatters; the timer card renders a locale-aware plural ("5 seconds" / "5 secondi"). |
| **Localized shells** | [`shell/*`](src/r-machine/shell) | UI content in `en` + `it`, authored as typed objects with `localized(...)` for the non-default locale. |

## Run it

This strategy serves each locale from its own domain, so first map the example
domains to localhost in your hosts file (`/etc/hosts` on macOS/Linux,
`C:\Windows\System32\drivers\etc\hosts` on Windows):

```
127.0.0.1   english.test
127.0.0.1   italiano.test
```

Then:

```bash
pnpm install
pnpm dev      # http://english.test:3000 / http://italiano.test:3000
```

(From the monorepo root: `pnpm --filter @r-machine/examples-next-with-app-origin-strategy <script>`.)

## Layout

- `src/r-machine/` — R-Machine resources (`base/config`, `outer/timer`, shells),
  plus `setup.ts`, `resource-atlas.ts`, `path-atlas.ts`, and the client/server toolsets.
- `src/app/[locale]/` — landing, `example-static/*`, and `example-dynamic/*` routes.
- `src/app/(non-localized)/` — routes served on every origin without a locale prefix.
- `src/components/` — `client/*` (plug consumers: timer card, route playground, nav, switcher) and `server/*`.
- `src/proxy.ts` — the Next.js middleware entry point.
