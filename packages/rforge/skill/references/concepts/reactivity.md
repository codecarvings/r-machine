# Concept — Read-driven reactivity & `_.cell`

A consumer re-renders based on **what it actually reads** — no dependency arrays,
no selectors. The unit of subscription depends on which getter it read:

- **`_.getter(() => $.state.x)`** (or raw `$.state`) subscribes to the **whole
  gear-instance state**: the consumer re-renders on _any_ action that changes
  _any_ leaf of that state.
- **`_.cell(() => …)`** (short for _getterCell_) is **its own dependency**. It
  **memoizes** its body and backs the value with its own cell in the reactive
  graph. A consumer that reads only a cell re-renders **solely when the cell's
  output changes by `Object.is`**. When an unrelated action runs, the cell is
  marked dirty, recomputes lazily on next read, and — if the output is
  `Object.is`-unchanged — notifies no one.

So `_.cell` is the lever for **fine-grained reactivity**: derive a value once,
and only the components reading that derived value re-render when it actually
changes.

```ts
// outer/cart.ts
count:    _.cell(() => $.state.items.length),                       // fine-grained
subtotal: _.cell(() => $.state.items.reduce((s, l) => s + l.price, 0)), // fine-grained
state:    _.getter(),                                               // whole-state dep
```

Rule of thumb: reach for `_.cell` for a **derived/computed** value many
components read; a plain `_.getter` is fine for a direct field. See the OuterGear
patterns in [../patterns/outer.md](../patterns/outer.md).
