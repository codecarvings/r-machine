# R-Machine Patterns — Vertex Gear (`gear:outer(vertex)`)

**Identical to `OuterGear`** in call shape (see [outer.md](./outer.md) for the
full composer surface). The vertex nature comes from the layout entry
(`"vertex/": "gear:outer(vertex)"`), not the composer.

```ts
// src/r-machine/pub/vertex/shopping-cart.ts
import { OuterGear, type RShape } from "@/r-machine/setup";

export const r = OuterGear.withState({ items: [] as string[] }).define(
  (plugin, _) => {
    const { $ } = plugin;
    return {
      add: _.action((item: string) => ({ items: [...$.state.items, item] })),
      count: _.getter(() => $.state.items.length),
      state: _.getter(),
    };
  },
);

export type Vertex_ShoppingCart = RShape<typeof r>;
```

Reminders:

- Vertex gears **cannot be a dep** of any other resource, and are not valid in a
  consumer kit (`kit` / `clientKit`) — only as a plug dep.

---

## Consume it — several independent instances on one page

This is the reason the family exists, so get it right explicitly rather than by
inference. An `outer/` gear is **one shared instance** per `(namespace, locale)`:
render its component twice and both copies show the same state. A `vertex/` gear
is **one instance per consumption site**:

```tsx
// components/client/counter.tsx
"use client";

import { ClientPlug } from "@/r-machine/client-toolset";

const plug = ClientPlug("vertex/counter");
export function Counter() {
  const [counter] = plug.useR();
  return <button onClick={counter.increment}>{counter.count}</button>;
}
Counter.plug = plug;
```

```tsx
// Two siblings, two independent counters. Clicking one does not move the other.
<Counter />
<Counter />
```

(The snippet is Next — a React/Vite project imports `Plug` from
`@/r-machine/toolset` instead; the shape is identical.)

The `plug` const is module-level and shared by every render — **the instance is
not**. Each `useR()` call site gets its own, so independence needs no key, no
prop and no wrapper. That is the default; sharing is what costs a wrapper.

**Getting this backwards fails silently.** Two counters that wrongly share state
look identical to two independent ones until someone clicks — there is no
compile error and no warning. So when a request is "let this appear several times
on the page", say in the summary which of the two you built.

## Share one instance — `<VertexFrame>`

The opposite case: several components that must read and write **the same**
vertex instance. The parent resolves it once and puts it in a frame; every
descendant plugging the same namespace joins that instance instead of creating
one.

```tsx
const plug = ClientPlug("vertex/catalog-filter");
export function CatalogClient() {
  const [filter] = plug.useR();
  return (
    <VertexFrame gear={[filter]}>
      <CatalogFilterBar /> {/* both read and write */}
      <CatalogGrid /> {/* the same filter instance */}
    </VertexFrame>
  );
}
CatalogClient.plug = plug;
```

`gear` takes one surface or an array of them (`gear={filter}` and
`gear={[filter]}` are both valid; the array shares several vertex gears through
one frame). `VertexFrame` ships with the plug it pairs with:
`strategy.createClientToolset()` in Next (alongside `ClientPlug`),
`strategy.createToolset()` in React (alongside `Plug`).

---

## Test it

A vertex gear is an OuterGear — test it the same way (mock its plug, seed state,
run the real members). Because it cannot be a dep, you mock its OWN plug
directly. Its test mirrors the source path
(`src/r-machine/pub/vertex/shopping-cart.ts` → `tests/r-machine/pub/vertex/shopping-cart.test.ts`).
See [outer.md](./outer.md#test-it) and [../testing.md](../testing.md).
