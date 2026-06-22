# R-Machine Patterns — Consume with `ClientPlug` (Next.js client, sync)

The Next.js client consumer. Synchronous, Suspense-driven, requires
`"use client"`. To mock this plug in a test see
[../../testing.md](../../testing.md).

```tsx
"use client";
import { ClientPlug } from "@/r-machine/client-toolset";

const plug = ClientPlug("outer/cart");
export function CartButton() {
  const [cart] = plug.useR();
  return <button onClick={() => cart.add("item-1")}>{cart.count} items</button>;
}
CartButton.plug = plug;
```

**Multiple resources** (a gear + a localized shell, etc.) — list/map form, same as
[plug.md](./plug.md#consume-multiple-resources):
`ClientPlug("outer/cart", "shell/cart")` → `const [cart, s, $] = plug.useR()`.

**Language switcher** — a resourceless `ClientPlug()` + `$.setLocale(locale)`; same
recipe as [plug.md](./plug.md#switch-the-locale-language-switcher) (add `"use client"`).

**Localized links** — build type-safe localized URLs with
`$.getPath("/product/[id]", { id })` (needs a `PathAtlas`, default-created for Next);
see [../../next-features.md](../../next-features.md#pathatlas-and-localized-urls).

---

## Mock it in a test

Same as [plug.md](./plug.md#mock-it-in-a-test), but also stub `next/navigation`
(the client toolset reads its hooks during render):

```ts
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/cart",
}));
```

Full pattern in [../../testing.md](../../testing.md).
