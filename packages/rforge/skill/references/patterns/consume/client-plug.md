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

**Deps allowed** — `gear:base`, `gear:outer`, `gear:outer(vertex)`, `shell` /
`shell(mono)` (same catalog as the React `Plug`). A `ClientPlug` **cannot** reach an
`inner/` gear: inner is server-only and never enters the client bundle — the compiler
rejects it. See [../../concepts/dep-asymmetry.md](../../concepts/dep-asymmetry.md).

**Language switcher** — a resourceless `ClientPlug()` for the `$` context only.
The **shape** is the same as [plug.md](./plug.md#switch-the-locale-language-switcher),
but the imports are Next-specific — there is **no `toolset.ts` / bare `Plug`** in a
Next project; use `ClientPlug` from `@/r-machine/client-toolset` and add `"use client"`:

```tsx
"use client";
import { localeHelper, type Locale } from "@/r-machine/setup";
import { ClientPlug } from "@/r-machine/client-toolset";

// Autonyms — locale-invariant, so hardcoded, not a shell (see plug.md's note).
const LOCALE_NAMES: Record<Locale, string> = { en: "English", it: "Italiano" };

const plug = ClientPlug(); // no resources — only the $ context
export function LocaleSwitcher() {
  const { $ } = plug.useR();
  return (
    <select
      value={$.locale}
      onChange={(e) => $.setLocale(e.target.value as Locale)}
    >
      {localeHelper.locales.map((l) => (
        <option key={l} value={l}>
          {LOCALE_NAMES[l]}
        </option>
      ))}
    </select>
  );
}
LocaleSwitcher.plug = plug;
```

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
