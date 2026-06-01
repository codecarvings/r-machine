# R-Mart — R-Machine × Next.js example

A small fake e-commerce store (**catalog → product detail → cart**) built with
[R-Machine](https://rmachine.dev) on the Next.js App Router. It's a guided tour
of every R-Machine primitive in one coherent app — not a feature checklist, but
a real flow you can click through.

The store ships in **English (USD)** and **Italian (EUR)**. Flip the locale from
the header and watch language, **currency, and number formatting** all change at
once — with zero `if (locale === …)` anywhere in the components. That's the core
idea: **i18n is dependency injection**. The price is just a context-dependent
resource the container resolves for the active locale.

## What it demonstrates

| R-Machine primitive | Where | What it shows |
| --- | --- | --- |
| **InnerGear** | [`inner/catalog`](src/r-machine/inner/catalog.ts) | Stateless, app-global resource. Loads products through an async **port** (`fetchProducts`) → the server component suspends while it resolves. |
| **BaseGear** | [`base/store-config`](src/r-machine/base/store-config.ts) | Stateless, juncture-scoped store configuration that other gears depend on. |
| **OuterGear** | [`outer/cart`](src/r-machine/outer/cart.ts) | The reactive cart: actions, a memoized `subtotal` cell, an item-count getter, a persistence relay, and SSR-hydration seeding. Browser-session state that survives navigation. |
| **Vertex** (request-scoped outer) | [`vertex/catalog-filter`](src/r-machine/vertex/catalog-filter.ts) | Per-page sort/category state, **shared** between the filter bar and the grid via `<VertexFrame>`. |
| **Shells** (multilingual) | [`shell/{common,catalog,product,cart}`](src/r-machine/shell) | Localized UI content (en + it), authored as plain typed objects with `localized(...)` for non-default locales. |
| **Mono shell** | [`shell/lib/fmt`](src/r-machine/shell/lib/fmt.ts) | Per-locale `Intl` formatters — USD vs EUR currency, number grouping, pluralization. The engine behind the "wow" moment. |
| **Typed dependency scoping** | everywhere | `outer/cart` *cannot* import `inner/catalog` (the validity matrix forbids `outer → inner`), so cart lines carry a denormalized price snapshot — the compiler steers you to the correct design. |
| **Server / client split** | [`app/[locale]`](src/app/[locale]) + [`components`](src/components) | Pages and server components read inner/shell via `ServerPlug`; client islands read outer/vertex via `ClientPlug`. Product data crosses the boundary as plain props. |
| **Unit testing with `mockPlug`** | [`tests/r-machine`](tests/r-machine) | One testing primitive for everything: it seeds gears in resource tests **and** seeds a real component (`cart-view.test.tsx`) rendered through the live runtime. `verifyResourceAtlas` checks every shell resolves for every locale. |

## Run it

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm test     # vitest: resource + component + atlas tests
```

(From the monorepo root: `pnpm --filter @r-machine/examples-next <script>`.)

## Layout

- `src/r-machine/` — all R-Machine resources (gears, shells), plus `setup.ts`,
  `resource-atlas.ts`, `path-atlas.ts`, and the client/server toolsets.
- `src/app/[locale]/` — catalog, `product/[id]`, and `cart` routes.
- `src/components/` — `client/*` (plug consumers) and `server/*` server components.
- `src/lib/` — the async ports (`catalog-port`, `cart-port`).
