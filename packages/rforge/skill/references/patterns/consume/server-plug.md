# R-Machine Patterns — Consume with `ServerPlug` (Next.js server, async)

The Next.js server consumer. Async. The locale is bound **once per request**, at
the **page / layout** entry point that receives route `params` — nested server
components **inherit** it (see "Entry point vs nested" below). To mock this plug in
a test see [../../testing.md](../../testing.md).

```tsx
import { ServerPlug } from "@/r-machine/server-toolset";

const plug = ServerPlug("shell/product");
export default async function ProductPage({ params }) {
  const [product] = await plug.useR(params);
  return <h1>{product.title}</h1>;
}
ProductPage.plug = plug;
```

**Entry point vs nested — the #1 mistake when extracting a server component.**
Only a **page or layout** (the component Next hands `params`) binds the locale, via
`plug.useR(params)`. A **nested** server component rendered inside that request
**must not re-bind**: it takes **no `params` prop** and calls `plug.useR()` with
**no arguments** — the locale, `$`, and `$.getPath` are inherited from the request:

```tsx
import Link from "next/link";
import { ServerPlug } from "@/r-machine/server-toolset";

const plug = ServerPlug("shell/nav"); // nested component — no params
export async function Nav() {
  const [nav, $] = await plug.useR(); // inherits the request-bound locale
  return <Link href={$.getPath("/")}>{nav.home}</Link>;
}
Nav.plug = plug;
```

Passing `params` into a nested component and calling `useR(params)` still works,
but it **re-binds** a locale the request already established and couples the
component to a prop it does not need — don't.

**Three call sites, three forms.** The dichotomy above covers the _render tree_.
A route file exports more than its component, and those other exports are a
**third** case. The question that discriminates them is not which Next API you
are in — it is **does this function own the render tree for this request?**

| Call site                                                                          | Form                                 | Why                                    |
| ---------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------- |
| **page / layout** — the function Next hands `params`                               | `plug.useR(params)`                  | **binds** the locale for the request   |
| **nested server component** — takes no `params`                                    | `plug.useR()`                        | **inherits** the bound locale          |
| **any other export** — `generateMetadata`, `generateStaticParams`, a route handler | `plug.useUnboundR(params \| locale)` | needs the locale, must **not** bind it |

`useUnboundR` is not a stylistic variant of `useR`:

- `useR(params)` → `bindLocale`: writes the locale into the request context (so
  nested components can call `useR()`), calls `notFound()` on an invalid locale,
  and throws `ERR_LOCALE_BIND_CONFLICT` if the request binds twice with
  different values.
- `useUnboundR(params)` → `getValidLocale`: validates and canonicalises only. It
  never touches the context, and **throws** on an invalid locale instead of
  making a routing decision.

`generateMetadata` has no children to inherit a binding, and Next may resolve it
in a pass separate from the render: binding there is useless at best, and a side
effect outside its mandate at worst.

`useUnboundR` **always takes an argument** — there is no `useUnboundR()`. A
function with neither a locale nor `params` is a nested component: use `useR()`.

`DirectPlug` has **no** `useUnboundR` — it never binds anything, so `useR(locale)`
is already the unbound form.

**Complete `ServerPlug` surface** — there are no other methods:
`useR()` · `useR(params)` · `useR(locale)` · `useUnboundR(params)` · `useUnboundR(locale)`

**One plug per function — and the plug travels on that function.** A plug is the
dependency declaration of **one** unit. When a module exports more than one unit
that consumes resources (a page _and_ its `generateMetadata`, a `[slug]` page
_and_ its `generateStaticParams`), each gets its **own** plug, attached to its
own function:

```tsx
const metaPlug = ServerPlug("shell/common");
export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const [s] = await metaPlug.useUnboundR(params); // read, don't bind
  return { title: s.title };
}
generateMetadata.plug = metaPlug;

const pagePlug = ServerPlug();
export default async function LocaleLayout({ params, children }: LayoutProps<"/[locale]">) {
  const { $ } = await pagePlug.useR(params); // binds for the request
  …
}
LocaleLayout.plug = pagePlug;
```

Sharing one plug between two exports is not a shortcut, it is a lost contract:
`mockPlug` reaches a unit through `Fn.plug` and keys everything on that plug's
identity, so a shared plug makes it impossible to mock the metadata without also
mocking the page — and mocking both in one test throws
`ERR_PLUG_ALREADY_MOCKED`. A function with no `.plug` is not mockable at all.
Re-declaring the same namespace costs nothing: a plug is a declaration, not an
instance.

The carrier is **whichever function calls the plug**, not necessarily the default
export. A page that delegates to an inner component so a `<Suspense>` boundary
can wrap the await puts the plug on the inner one:

```tsx
const plug = ServerPlug("inner/catalog", "shell/catalog");
async function CatalogContent({ params }: PageProps<"/[locale]">) {
  const [catalog, s] = await plug.useR(params);
  …
}
CatalogContent.plug = plug; // ← the consumer, not CatalogPage

export default function CatalogPage(props: PageProps<"/[locale]">) {
  return <Suspense fallback={<CatalogSkeleton />}><CatalogContent {...props} /></Suspense>;
}
```

**Multiple resources** (inner gear + shells, etc.) — list/map form, same as
[plug.md](./plug.md#consume-multiple-resources), but async:
`ServerPlug("inner/catalog", "shell/product")` → `const [catalog, s, $] = await plug.useR(params)`.

**Deps allowed** — `gear:inner`, `gear:base`, `shell` / `shell(mono)`. `ServerPlug` is
the **only** consumer that reaches server-only `inner/` gears; conversely it **cannot**
reach `outer/` or `vertex/` gears (client-reactive — consume those with `ClientPlug`).
See [../../concepts/dep-asymmetry.md](../../concepts/dep-asymmetry.md).

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
