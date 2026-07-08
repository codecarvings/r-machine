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
a `Partial<State>` (object state) or the new scalar value (scalar state) —
never `_.cmd(...)`.

```ts
// ✅ correct — _.cmd inside _.relay onChange
_.relay({ select: () => $.state.x, onChange: (v) => _.cmd(setX, v) });

// ✅ correct — action returns partial state directly
const start = _.action(() => {
  handle = setInterval(tick, 1000);
  return { running: true }; // just return the state change
});

// ❌ wrong — _.cmd inside an action return
const start = _.action(() => {
  handle = setInterval(tick, 1000);
  return _.cmd(setRunning, true); // invalid
});
```

If an action needs to both perform a side effect AND update state, return the
state partial directly — no need to call another action via `_.cmd`.

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
