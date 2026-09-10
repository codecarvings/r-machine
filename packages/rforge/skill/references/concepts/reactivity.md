# Concept — Read-driven reactivity & `_.cell`

A consumer re-renders based on **what it actually reads** — no dependency arrays,
no selectors. The unit of subscription depends on which getter it read:

- **`_.getter(() => $.state.x)`** (or raw `$.state`) subscribes to the **whole
  gear-instance state**: the consumer re-renders on _any_ action that changes
  _any_ leaf of that state.
- **`_.cell(() => …)`** (short for _getterCell_) is **its own dependency**. It
  **memoizes** its body and backs the value with its own cell in the reactive
  graph. A consumer that reads only a cell re-renders **solely when the cell's
  output changes by `Object.is`**. When an unrelated action runs the cell
  recomputes — **immediately** if anything is subscribed to it, lazily on the
  next read if nothing is — and, if the output is `Object.is`-unchanged, notifies
  no one.

So `_.cell` is the lever for **fine-grained reactivity**: derive a value once,
and only the components reading that derived value re-render when it actually
changes.

```ts
// outer/cart.ts
count:    _.cell(() => $.state.items.length),                       // fine-grained
subtotal: _.cell(() => $.state.items.reduce((s, l) => s + l.price, 0)), // fine-grained
state:    _.getter(),                                               // whole-state dep
```

## Choosing between them — `_.getter` is the default

The two are interchangeable at the type level (both return `Getter<V>`), so the
compiler will not correct a wrong choice. Decide with the rules below, not by
judgement; each one is answerable from the member body and the state shape in
front of you.

**Default to `_.getter`.** A cell is not free: it allocates its own cassette and
subscriber sets, adds a node to the reactive graph, and — this is the part that
inverts the usual intuition — a cell **with subscribers is eager, not lazy**. On
every state change it recomputes _immediately_, just to find out whether its
output changed and therefore whether to notify. A `_.getter` only runs when
someone reads it.

**Reach for `_.cell` only when at least one of these holds:**

1. **The body allocates** — `.map` / `.filter` / `.slice`, an object literal, a
   spread. A `_.getter` is the raw body, re-run on every read, so it hands out a
   **new reference every time**: `React.memo` children, `useMemo` deps and the
   React Compiler all lose. A cell returns the same reference until a dep changes.
2. **The body is a non-trivial computation** over a collection — `reduce`, sort,
   scan. The cell caches it across reads.
3. **The output can stay `Object.is`-unchanged while the state changes**, _and_
   that happens often. This is the only re-render gate you have: state is **one
   cell**, so a consumer reading a `_.getter` subscribes to the **whole state**
   and re-renders on any action touching any leaf. A cell interposes itself and
   notifies only when its own output actually changes.

**Two cases where a cell is wrong, not merely unnecessary:**

- **A direct projection of a single-field state.** `withState({ count: 0 })` with
  `count: _.getter(() => $.state.count)` — the state changes _if and only if_
  `count` changes, so there is nothing to gate. A cell here is pure overhead.
- **An expensive allocating body over frequently-changing state.** The output is
  a fresh reference every recompute, so `Object.is` is **never** true and the cell
  **never** suppresses a notification — you pay the eager recompute _and_
  re-render anyway. Rule 1 still applies if you need the stable reference for a
  memoized child; otherwise leave it a getter.

See the OuterGear patterns in [../patterns/outer.md](../patterns/outer.md).
