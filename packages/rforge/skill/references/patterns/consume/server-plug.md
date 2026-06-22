# R-Machine Patterns — Consume with `ServerPlug` (Next.js server, async)

The Next.js server consumer. Async; binds the locale from the request scope
(via `params`). To mock this plug in a test see
[../../testing.md](../../testing.md).

```tsx
import { ServerPlug } from "@/r-machine/server-toolset";

const plug = ServerPlug("shell/product");
export default async function ProductPage({ params }) {
  const [product] = await plug.useR(params);
  return <h1>{product.title}</h1>;
}
ProductPage.plug = plug;
```

**Multiple resources** (inner gear + shells, etc.) — list/map form, same as
[plug.md](./plug.md#consume-multiple-resources), but async:
`ServerPlug("inner/catalog", "shell/product")` → `const [catalog, s, $] = await plug.useR(params)`.

**Localized links** — build type-safe localized URLs with the awaited `$`:
`$.getPath("/product/[id]", { id })` (needs a `PathAtlas`, default-created for Next);
see [../../next-features.md](../../next-features.md#pathatlas-and-localized-urls).

**Adding a page?** Register its route in `path-atlas.ts` (with per-locale
translations unless the strategy is Flat) — see
[../../next-features.md](../../next-features.md#register-a-new-pages-route).

---

## Mock it in a test

Run in `node`. Mock the component **itself** (`mockPlug(ProductPage)` — its plug
rides along as `ProductPage.plug` and declares the component's deps), never a
dependency's plug. `useR(params)` binds the locale from route params;
`.default()` resolves at the default locale. Override a dependency's surface
THROUGH this plug by position/name.

```tsx
// @vitest-environment node
import { mockPlug } from "@r-machine/testing";
import ProductPage from "./product-page"; // the plug rides along as ProductPage.plug

// ProductPage.plug = ServerPlug("shell/product") → dep 0 is the product shell.
using _ctrl = mockPlug(ProductPage).with({ 0: { title: "Mock Title" } });
const el = await ProductPage({
  params: Promise.resolve({ locale: "en", id: "kbd-01" }),
} as never);
// walk the element tree for raw strings and assert "Mock Title"
```

Stub `next/navigation`'s `notFound`. Full pattern in [../../testing.md](../../testing.md).
