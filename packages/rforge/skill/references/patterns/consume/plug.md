# R-Machine Patterns — Consume with `Plug` (React, sync)

The React consumer. Synchronous, Suspense-driven. Lives in a component file. To
mock this plug in a test see [../../testing.md](../../testing.md).

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
gets both behavior (a gear) and localized content (a shell), even though a gear
can never depend on a shell. The **consumer is where the independent families
meet** (see [../../concepts/dep-asymmetry.md](../../concepts/dep-asymmetry.md)).

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
import { localeHelper, type Locale } from "@/r-machine/setup";
import { Plug } from "@/r-machine/toolset"; // Next client → ClientPlug + "use client"

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
          {l}
        </option>
      ))}
    </select>
  );
}
LocaleSwitcher.plug = plug;
```

`$.setLocale` is on `Plug` / `ClientPlug` / `ServerPlug` — **not** `DirectPlug`
(no bound container; its locale is passed to `useR(locale)`). See
[../../concepts/plugs-and-containers.md](../../concepts/plugs-and-containers.md).

---

## Or — consume as a dep in another resource (not a plug)

A resource consumes another resource through `withDeps`, not through a plug:

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
  ctrl.deps[0].state = {
    /* the dep gear's state */
  };
  await act(async () => {
    render(<CartButton />);
  });
  // assert via screen … then fireEvent.click(...) and assert the re-render
});
```

Full pattern in [../../testing.md](../../testing.md).
