# R-Machine Patterns — Cloning resources (`r.clone(...)`)

`clone` derives a **new resource** from an existing one — same factory and chain,
but its own module, atlas key, plug, instance, and state. It is the
build-time/structural counterpart to `mockPlug` (which is test-time). All
composers support it: `InnerGear`, `BaseGear`, `OuterGear` (stateless & stateful),
`Shell` — including after `withPorts(...)` / `withState(...)`.

`clone(fn?)` takes an optional transform `fn` that receives the fully-resolved
resource (and `plugin[, cursor]`) and returns **only overridden fields** — no new
keys (the shape is locked to the original).

## Same logic, multiple atlas slots — `clone()` (no-arg)

When N independent instances must coexist under distinct namespaces (three product
cards, several carts). Each clone has its own state at runtime.

```ts
// outer/cart-secondary.ts
import { r as base } from "./cart";

export const r = base.clone(); // identical logic, new identity
export type Outer_CartSecondary = RShape<typeof r>;
```

Register `outer/cart-secondary` in `resource-atlas.ts` like any resource.

## Variant with different external bindings — `withPorts(...).clone()`

Same logic against a different boundary (draft vs published, stub vs real CMS):

```ts
import { r as base } from "./catalog";
export const r = base.withPorts({ fetchProducts: fetchDrafts }).clone();
```

## Variant with different starting state — `withState(...).clone()`

Stateful `OuterGear` only; commutes with `withPorts`:

```ts
import { r as base } from "./counter";
export const r = base.withState({ count: 100 }).clone();
```

## Sibling locale/regional variant — `clone(fn)`

The factory runs in the clone's context; `fn` overrides only the differing values:

```ts
import { r as base } from "./greeting";
export const r = base.clone((res) => ({
  greet: (n: string) => `G'day, ${n}!`,
}));
```
