# R-Machine Patterns — OuterGear

Code templates for the `gear:outer` family. Adapt member names, state shape, and
deps to the user's request. Replace `<Ns_Name>` with the derived type name (e.g.
`Outer_Cart`). For the map-form vs list-form plugin rule see
[plugin-context.md](./plugin-context.md); to test an OuterGear see
[../testing.md](../testing.md).

---

## OuterGear — stateless, no deps

```ts
import { OuterGear, type RShape } from "@/r-machine/setup"; // adjust path depth

export const r = OuterGear.define(() => ({
  greet: (name: string) => `Hello ${name}`,
}));

export type Outer_Foo = RShape<typeof r>;
```

## OuterGear — stateless, with deps (list form)

```ts
import { OuterGear, type RShape } from "@/r-machine/setup";

export const r = OuterGear.withDeps("outer/other", "base/config").define(
  (plugin) => {
    const [other, config] = plugin;
    return {
      combined: () => other.value + config.apiBase,
    };
  },
);

export type Outer_Foo = RShape<typeof r>;
```

Use the **map form** for three or more deps (survives renames better):

```ts
export const r = OuterGear.withDeps({
  other: "outer/other",
  cfg: "base/config",
}).define((plugin) => {
  const { other, cfg } = plugin;
  return {
    combined: () => other.value + cfg.apiBase,
  };
});
```

## OuterGear — stateful (full cursor form)

```ts
import { OuterGear, type RShape } from "@/r-machine/setup";

export const r = OuterGear.withState({ count: 0 }).define((plugin, _) => {
  const { $ } = plugin;
  return {
    increment: _.action(() => ({ count: $.state.count + 1 })),
    decrement: _.action(() => ({ count: $.state.count - 1 })),
    reset: _.action(() => ({ count: $.defaultState.count })),
    count: _.getter(() => $.state.count),
  };
});

export type Outer_Counter = RShape<typeof r>;
```

## OuterGear — stateful (scalar state)

State does not have to be an object — a primitive works too. When the state is
a scalar, `$.state` **is** that scalar and an action returns the **new scalar
value** (there is no partial to merge):

```ts
import { OuterGear, type RShape } from "@/r-machine/setup";

export const r = OuterGear.withState(0).define((plugin, _) => {
  const { $ } = plugin;
  return {
    increment: _.action(() => $.state + 1), // return the new scalar, not a partial
    value: _.getter(), // no-arg getter returns the whole state
  };
});

export type Outer_Counter = RShape<typeof r>;
```

## OuterGear — stateful (array shorthand, read-write)

When all you need is a getter + a canonical setter, the array shorthand is
the leanest option. R-Machine synthesises the getter and a `(partial) => state`
action automatically:

```ts
export const r = OuterGear.withState({ count: 0 }).define(() => [
  "counter",
  "setCounter",
]);
// Surface: { counter: { count: number }; setCounter: (p: Partial<...>) => ... }

export type Outer_Counter = RShape<typeof r>;
```

## OuterGear — stateful (array shorthand, readonly)

```ts
export const r = OuterGear.withState({ count: 0 }).define(() => ["counter"]);
// Surface: { counter: { count: number } }

export type Outer_Counter = RShape<typeof r>;
```

## OuterGear — stateful with relay (side effect on state change)

```ts
import { OuterGear, type RShape } from "@/r-machine/setup";

export const r = OuterGear.withState({ count: 0, isOdd: false }).define(
  (plugin, _) => {
    const { $ } = plugin;
    const setIsOdd = _.action((isOdd: boolean) => ({ isOdd }));

    _.relay({
      select: () => $.state.count,
      onChange: (curr) => _.cmd(setIsOdd, curr % 2 !== 0),
    });

    return {
      increment: _.action(() => ({ count: $.state.count + 1 })),
      count: _.getter(() => $.state.count),
      isOdd: _.getter(() => $.state.isOdd),
    };
  },
);

export type Outer_Counter = RShape<typeof r>;
```

**Critical rule — `_.cmd` scope:**
`_.cmd` is **only valid** as the return value of `_.relay`'s `onChange` callback.
It is **NOT valid** inside an `_.action` body. An action returns the next state:
a `DeepPartial<State>` (object state) or the new scalar value (scalar state) —
never `_.cmd(...)`. See [Action return semantics](#action-return-semantics--the-deep-partial-merge)
for what "deep partial" buys you and where it bites.

```ts
// ✅ correct — _.cmd inside _.relay onChange
_.relay({ select: () => $.state.x, onChange: (v) => _.cmd(setX, v) });

// ✅ correct — an action is a pure reducer: it returns the next state
const start = _.action(() => ({ running: true }));

// ❌ wrong — _.cmd as an action's return value
const start = _.action(() => _.cmd(setRunning, true));

// ❌ wrong — a side effect in an action body. It typechecks (the return value
// is still a valid state partial), so nothing warns you: the effect now fires
// on the CLICK instead of on the STATE, and drifts the moment the state
// changes by any other route (HMR restore, cassette, a test seed, another
// action). The interval belongs in a relay on `running`.
const start = _.action(() => {
  handle = setInterval(tick, 1000);
  return { running: true };
});
```

**An action never performs a side effect.** It is a synchronous reducer:
arguments in, `DeepPartial<State>` out (or the new value, for scalar state).
Anything that must _happen_ when state changes goes in a `_.relay` keyed on that
state; anything that must happen once at construction goes in the factory body;
anything that must be undone goes in `[Symbol.dispose]`. Keeping actions pure is
what lets a relay be the single owner of an effect — and therefore what makes
the effect impossible to desync from the state that drives it.

## Action return semantics — the deep-partial merge

An action returns a **`DeepPartial<State>`**, not a shallow `Partial`. The
returned fragment is deep-merged over the current state, so you write only the
leaf you are changing and every sibling is preserved:

```ts
// state: { user: { name: "ada", prefs: { theme: "dark", lang: "en" } } }
const setTheme = _.action((theme: string) => ({ user: { prefs: { theme } } }));
// → prefs.lang and user.name are untouched. No spreading, no re-stating siblings.
```

Four rules, none of them guessable:

- **Only plain objects merge.** Anything else **replaces** wholesale — arrays,
  `Date`, `Map`, `Set`, `RegExp`, `URL`, class instances, primitives. So
  `{ tags: ["z"] }` **replaces** the whole array; there is no element-wise merge.
  To append, build the new array from the old one:
  `_.action((t: string) => ({ tags: [...$.state.tags, t] }))`.

- **`undefined` is a no-op, not a value.** A key whose value is `undefined` is
  **skipped** by the merge, so an action **cannot clear a field** that way —
  `{ note: undefined }` leaves `note` exactly as it was, and nothing warns you.
  Model a clearable field as `T | null` and return `null`, which _does_ replace.
  Returning `undefined` from the whole reducer likewise means "no change".

- **A no-op keeps the state identity.** If every key in the fragment is already
  `Object.is`-equal to what is in state, the merge returns the **same** state
  reference — no new object, so nothing downstream sees a change. That is what
  makes an idempotent action cheap, and why writing an equal value does not
  wake subscribers.

- **It is a merge, not a transaction hook.** The reducer must be pure and
  synchronous: compute from `$.state` and arguments, return the fragment. No
  `await`, no side effect, no `_.cmd` (see the rule above).

For **scalar state** (`withState(0)`, `withState("")`) there is nothing to merge:
the action returns the **new value** directly.

## Relay semantics — read this before writing one

A relay is `{ select, onChange, equals? }`. `select` is tracked: the relay
subscribes to every state cell / cell it reads, and re-runs when one mutates.
The exact behaviour matters, and most of it is not guessable:

- **It does NOT fire on registration.** The initial pass captures dependencies
  and seeds the previous value _without_ calling `onChange` — the semantics are
  "react to changes", not "react to existence". So if the effect must also hold
  for the state you **start** with (already `running`, already `open`), call the
  handler once yourself in the factory body, then register the relay:

  ```ts
  syncInterval($.state.running); // covers restored / seeded state
  _.relay({ select: () => $.state.running, onChange: syncInterval });
  ```

  This is not a corner case: OuterGear state survives HMR, so a gear can be
  re-created with a state it never saw change.

- **`equals` decides when `onChange` runs.** Default `"identity"`
  (`Object.is`); `"shallow"` compares own enumerable keys one level deep; or
  pass your own `(current, prev) => boolean`. Returning `true` means
  "equivalent" and **suppresses** the call. Select an object without `shallow`
  and you fire on every new reference.

- **`onChange(current, prev)` may return** `void`, a `Cmd`, or a `Cmd[]` — build
  them with `_.cmd(action, ...args)`. A void return is perfectly valid: that is
  the form for a pure side effect (timers, subscriptions, logging).

- **Returned cmds are dispatched after every dirty relay has fired**, not
  inline. All relays in one flush therefore observe the same world state before
  any cmd-driven mutation begins; the resulting mutations are picked up in the
  next round of the same flush.

- **`onChange` may be `async`.** It is not awaited synchronously: the promise is
  scheduled on a microtask and its cmds are dispatched in a **separate**
  transaction, i.e. a later flush. Don't rely on an async relay's effect being
  visible to the action that triggered it.

- **A relay has no teardown.** There is no disposer in its config, so anything
  it creates (interval, listener, subscription) must be released in the gear's
  `[Symbol.dispose]`.

- **Runaway loops abort.** If one relay fires more than 3 times in a single
  flush, R-Machine emits a `relay:loopDetected` bus event and throws
  `RelayLoopError`. Usually it means `onChange` writes state that `select`
  reads; narrow `select` or add an `equals`.

- **Throws are contained, not propagated.** An error in `select` or `onChange`
  is swallowed and emitted as `relay:onChangeError` on the event bus (see
  [../testing.md](../testing.md) for asserting on bus events). A throwing
  `select` stalls that relay until its next successful pass — it does not take
  down the action that triggered it.

- **Firing order within a flush is deterministic, and it is not registration
  order.** Relays are sorted by (1) **depth** — the shortest distance from a
  namespace whose action mutated state to the relay's own gear, so a relay in
  the mutating gear fires first; then (2) the **priority** declared in the
  ResourceAtlas (lower index first; a namespace absent from the list sorts
  last); then (3) registration order as a stable tie-break. Don't encode an
  assumption about cross-gear ordering into a relay — make each one correct on
  its own.

- **A relay is overridable in tests.** Its three members are read live off the
  resource on every tick, so a test can reassign `res.$relay.onChange`,
  `.select`, or `.equals`. Expose it with a `$`-prefixed hidden member (see
  [Hidden members](#hidden-members--prefix)) to reach it without widening the
  public surface.

**Where each kind of code belongs:**

| Code                                   | Home                  |
| -------------------------------------- | --------------------- |
| pure state transition                  | `_.action` (reducer)  |
| derived read-only value                | `_.getter` / `_.cell` |
| must _happen_ when state changes       | `_.relay`             |
| must happen once, at construction      | the factory body      |
| must be undone when the gear goes away | `[Symbol.dispose]`    |

## OuterGear — stateful with lifecycle (`[Symbol.dispose]`)

When the factory acquires resources with longer lifetimes (intervals,
subscriptions, connections), return a `[Symbol.dispose]` member in the surface.
R-Machine calls it when the gear instance is torn down — no separate helper:

```ts
import { OuterGear, type RShape } from "@/r-machine/setup";

export const r = OuterGear.withState({ tick: 0 }).define((plugin, _) => {
  const { $ } = plugin;
  const inc = _.action(() => ({ tick: $.state.tick + 1 }));
  const handle = setInterval(inc, 1000);

  return {
    tick: _.getter(() => $.state.tick),
    [Symbol.dispose]: () => clearInterval(handle),
  };
});

export type Outer_Timer = RShape<typeof r>;
```

**Teardown rules:**

- `[Symbol.dispose]` is the **only** teardown convention — there is no
  `managed()` helper.
- The dispose function must be **synchronous**. `[Symbol.asyncDispose]` is
  rejected at runtime.

## OuterGear — with external ports

Use `withPorts` for server actions, SDK clients, fetch wrappers — anything
external to the gear that should be substitutable in tests:

```ts
import { OuterGear, type RShape } from "@/r-machine/setup";
import { submitForm } from "@/lib/actions";

export const r = OuterGear.withPorts({ submitForm })
  .withState({ pending: false, error: null as string | null })
  .define((plugin, _) => {
    const { $ } = plugin;
    return {
      submit: _.action(async (data: FormData) => {
        const result = await $.ports.submitForm(data);
        return { error: result.error ?? null };
      }),
      pending: _.getter(() => $.state.pending),
      error: _.getter(() => $.state.error),
    };
  });

export type Outer_Form = RShape<typeof r>;
```

## OuterGear — memoized cell (`_.cell`)

`_.cell(...)` is a memoized getter that is its own dependency: a consumer reading
only it re-renders when its output changes by `Object.is` — fine-grained
reactivity (see [../concepts/reactivity.md](../concepts/reactivity.md)). Use it for
derived values that many components read.

```ts
export const r = OuterGear.withState({ lines: [] as Line[] }).define(
  (plugin, _) => {
    const { $ } = plugin;
    return {
      lines: _.getter(() => $.state.lines),
      itemCount: _.cell(() => $.state.lines.reduce((n, l) => n + l.qty, 0)),
      subtotal: _.cell(() =>
        $.state.lines.reduce((s, l) => s + l.unitPrice * l.qty, 0),
      ),
      addItem: _.action((l: Line) => ({ lines: [...$.state.lines, l] })),
    };
  },
);

export type Outer_Cart = RShape<typeof r>;
```

## OuterGear — async factory (SSR-hydration seed)

The factory may be `async`. The canonical use is seeding initial state from a
server snapshot read through an **isomorphic `"use server"` port**, applied with
the no-arg canonical action `_.action()(...)`. The snapshot must be deterministic
for the request so the server render and the client hydration match (see
[../next-features.md](../next-features.md)).

```ts
import { OuterGear, type RShape } from "@/r-machine/setup";
import { loadCartSnapshot } from "@/lib/actions"; // "use server"

export const r = OuterGear.withPorts({ loadCartSnapshot })
  .withState({ items: [] as string[] })
  .define(async (plugin, _) => {
    const { $ } = plugin;
    _.action()(await $.ports.loadCartSnapshot()); // seed before wiring members
    return {
      items: _.getter(() => $.state.items),
      add: _.action((item: string) => ({ items: [...$.state.items, item] })),
    };
  });

export type Outer_Cart = RShape<typeof r>;
```

## Hidden members (`$`-prefix)

A returned member whose key starts with `$` is **stripped from the public
Surface** (and IDE tooltips) but stays on the resource — still reachable via
`mockPlug` in tests. Use it to expose an internal action/relay to tests without
leaking it to consumers. Applies to **any** family (gear or shell).

```ts
return {
  count: _.getter(() => $.state.count),
  $bump: _.action(() => ({ count: $.state.count + 1 })), // hidden from Surface, testable
};
```

In a test, the `TestSurface` still sees it: `(await ctrl.createRes()).$bump()`
(`$`-members are retained). See [../testing.md](../testing.md).

---

## Test it

```ts
import { mockPlug } from "@r-machine/testing";
import { r } from "@/r-machine/pub/outer/counter";

it("runs the real action against seeded state", async () => {
  using ctrl = mockPlug(r).default();
  ctrl.state = { count: 10 }; // deep-partial seed of the gear's own state
  const counter = await ctrl.createRes();

  counter.increment();
  expect(counter.count).toBe(11); // the real action runs; the getter reads as a property
});
```

Ports: seed via `.with({ $: { ports: { … } } })`. Full patterns (relay, scalar,
component-driven state) in [../testing.md](../testing.md).
