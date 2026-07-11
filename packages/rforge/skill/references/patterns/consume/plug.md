# R-Machine Patterns — Consume with `Plug` (React, sync)

The React consumer. Synchronous, Suspense-driven. Lives in a component file. To
mock this plug in a test see [../../testing.md](../../testing.md).

> **Scope — React (Vite) only.** `Plug` from `@/r-machine/toolset` exists in a
> React/Vite project. A **Next.js** project has no `toolset.ts`/bare `Plug`: use
> `ClientPlug` from `@/r-machine/client-toolset` ([client-plug.md](./client-plug.md))
> for interactive/client components and `ServerPlug` from `@/r-machine/server-toolset`
> ([server-plug.md](./server-plug.md)) for server components. The consumption
> **shape** below is identical across all of them — only the import module and plug
> name change.

```tsx
import { Plug } from "@/r-machine/toolset";

const plug = Plug("outer/cart");
export function CartButton() {
  const [cart] = plug.useR();
  return <button onClick={() => cart.add("item-1")}>{cart.count} items</button>;
}
CartButton.plug = plug;
```

---

## Consume multiple resources

A consumer plugs into **several namespaces at once** — this is how a component
gets both behavior (a gear) and localized content (a shell) as plain surfaces,
even though a gear reaches a shell only indirectly (as a locale loader via
`res.perLocale`). Same list/map declaration as `withDeps`, but keyed by the plug.

**Deps allowed** — `Plug` accepts `gear:base`, `gear:outer`, `gear:outer(vertex)`,
`shell` / `shell(mono)`. It **cannot** reach an `inner/` gear (server-only — absent
from a React bundle; a compile error). See
[../../concepts/dep-asymmetry.md](../../concepts/dep-asymmetry.md).

**List form** — positional; `useR()` returns a tuple, deps first and `$` last:

```tsx
const plug = Plug("outer/timer", "shell/timer");
export function Timer() {
  const [timer, t, $] = plug.useR(); // timer = gear surface, t = shell surface, $ = context
  return (
    <button onClick={timer.start}>
      {t.label}: {timer.elapsed}
    </button>
  );
}
Timer.plug = plug;
```

**Map form** — named (clearer beyond two deps):

```tsx
const plug = Plug({ timer: "outer/timer", t: "shell/timer" });
const { timer, t, $ } = plug.useR();
```

The same shape works on `ClientPlug` / `ServerPlug` / `DirectPlug` (Server and
Direct are async — `await plug.useR(...)`).

---

## Switch the locale (language switcher)

To change the active locale, call **`$.setLocale(locale)`** — it lives on the `$`
context of any plug, and the strategy persists the choice (cookie / localStorage /
origin, per strategy). A switcher needs **no resources**, so use a **resourceless
plug** just for `$` (current locale + `setLocale`):

```tsx
// React (Vite). In Next this is a client component — see client-plug.md
// (ClientPlug from @/r-machine/client-toolset + "use client").
import { localeHelper, type Locale } from "@/r-machine/setup";
import { Plug } from "@/r-machine/toolset";

// Language names are autonyms — locale-invariant, so hardcoded (see note below).
const LOCALE_NAMES: Record<Locale, string> = { en: "English", it: "Italiano" };

const plug = Plug(); // no resources — only the $ context
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

**Language names are autonyms, not localized** — each shows in its own name, which
is locale-invariant, so the map is hardcoded, _not_ a shell (a shell would
translate the names to the active locale — wrong for a switcher). If the switcher
has its own visible/aria text (e.g. a "Language" label), _that_ is localizable →
put it in a shell.

`$.setLocale` is on `Plug` / `ClientPlug` / `ServerPlug` — **not** `DirectPlug`
(no bound container; its locale is passed to `useR(locale)`). See
[../../concepts/plugs-and-containers.md](../../concepts/plugs-and-containers.md).

---

## From inside a resource — declare the dep with `withDeps`

Same dependency, **same list/map declaration** — a plug is just the _consumer_ entry
point. From **inside** a resource, declare the dep with `withDeps` instead: a resource is
constrained by its family (the matrix in
[../../concepts/dep-asymmetry.md](../../concepts/dep-asymmetry.md)), just as each plug is
constrained by its catalog. One mechanism, different sites, different rule sets:

```ts
OuterGear.withDeps("outer/cart").define((plugin, _) => {
  const [cart] = plugin;
  return {
    total: _.getter(() => cart.count * 10),
  };
});
```

---

## Mock it in a test

Render the component WITHOUT a provider — `mockPlug(CartButton)` relaxes the
provider guard (the plug rides along as `CartButton.plug`). Seed the dependency's
state with `ctrl.deps[…].state`; the real getters/actions run, so an interaction
re-renders through real reactivity:

```tsx
import { mockPlug } from "@r-machine/testing";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { CartButton } from "./cart-button";

it("renders seeded state and reacts to the real action", async () => {
  using ctrl = mockPlug(CartButton).with({ $: { ambientLocale: "en" } });
  ctrl.deps[0].state = {/* the dep gear's state */};
  await act(async () => {
    render(<CartButton />);
  });
  // FIRST assert must be async — Suspense-driven, first render is the empty fallback:
  //   expect(await screen.findByText("…")).toBeInTheDocument();
  // then getBy* for the rest, and fireEvent.click(...) to assert the re-render.
});
```

Full pattern in [../../testing.md](../../testing.md).
