# R-Machine Patterns — Vertex Gear (`gear:outer(vertex)`)

**Identical to `OuterGear`** in call shape (see [outer.md](./outer.md) for the
full composer surface). The vertex nature comes from the layout entry
(`"vertex/": "gear:outer(vertex)"`), not the composer.

```ts
// vertex/shopping-cart.ts
import { OuterGear, type RShape } from "../setup";

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

- Vertex gears **cannot be a dep** of any other resource.
- Each `Plug("vertex/...").useR()` call creates its own instance.
- Use `<VertexFrame gear={instance}>` to share one instance across descendants.

---

## Test it

A vertex gear is an OuterGear — test it the same way (mock its plug, seed state,
run the real members). Because it cannot be a dep, you mock its OWN plug
directly. See [outer.md](./outer.md#test-it) and [../testing.md](../testing.md).
