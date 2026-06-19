# R-Machine Resource Patterns

Code templates for every resource family. Adapt member names, state shape,
and deps to the user's request. Replace `<Ns_Name>` with the derived type
name (e.g. `Outer_Cart`).

---

## OuterGear — stateless, no deps

```ts
import { OuterGear, type RShape } from "../setup"; // adjust path depth

export const r = OuterGear.define(() => ({
  greet: (name: string) => `Hello ${name}`,
}));

export type Outer_Foo = RShape<typeof r>;
```

## OuterGear — stateless, with deps (list form)

```ts
import { OuterGear, type RShape } from "../setup";

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
import { OuterGear, type RShape } from "../setup";

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
import { OuterGear, type RShape } from "../setup";

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
import { OuterGear, type RShape } from "../setup";

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
import { OuterGear, type RShape } from "../setup";

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
import { OuterGear, type RShape } from "../setup";
import { submitForm } from "../lib/actions";

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

---

## Vertex Gear (`gear:outer(vertex)`)

**Identical to `OuterGear`** in call shape. The vertex nature comes from the
layout entry (`"vertex/": "gear:outer(vertex)"`), not the composer.

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

## BaseGear — static, no deps

```ts
import { BaseGear, type RShape } from "../setup";

export const r = BaseGear.define(() => ({
  apiBase: "https://api.example.com",
  timeout: 5000,
}));

export type Base_Config = RShape<typeof r>;
```

## BaseGear — with deps (list form)

```ts
import { BaseGear, type RShape } from "../setup";

export const r = BaseGear.withDeps("base/config").define((plugin) => {
  const [config] = plugin;
  return {
    fetch: async (path: string) => {
      const res = await globalThis.fetch(`${config.apiBase}${path}`);
      return res.json();
    },
  };
});

export type Base_Http = RShape<typeof r>;
```

## BaseGear — with external ports

```ts
import { BaseGear, type RShape } from "../setup";
import { createClient } from "../lib/db";

export const r = BaseGear.withPorts({ createClient }).define((plugin) => {
  const { $ } = plugin;
  return {
    query: async (sql: string) => $.ports.createClient().query(sql),
  };
});

export type Base_Db = RShape<typeof r>;
```

---

## InnerGear (Next.js server-only)

Same chain as `BaseGear`. Only `ServerPlug` can consume it.
Cannot be consumed by `Plug` or `ClientPlug`.

```ts
import { InnerGear, type RShape } from "../setup";

export const r = InnerGear.define(() => ({
  getSecret: () => process.env.SECRET_KEY!,
}));

export type Inner_Secrets = RShape<typeof r>;
```

---

## Shell — multi-locale, plain object (canonical)

Use this form when the shell is pure static translations with no dynamic logic:

```ts
// shell/product/en.tsx
import type { RShape } from "../../setup"; // adjust path depth

export const r = {
  title: "Product",
  addToCart: "Add to cart",
};

export type Shell_Product = RShape<typeof r>;
```

Locale variant (e.g. `it.ts`):

```ts
// shell/product/it.tsx
import { localized } from "../../setup";

export const r = localized("shell/product", {
  title: "Prodotto",
  addToCart: "Aggiungi al carrello",
});
```

## Plugin context: map form vs list form (crucial distinction)

The plugin argument shape depends on how deps are declared. This affects how
you access kit entries like `fmt`.

**Map form** — default when using `Shell.define(...)` with no args, or
`Shell.withDeps({ key: "ns" })`. The plugin is an **object**: all kit entries
are hoisted as top-level keys alongside any named deps and `$`.

```ts
// Both of these are equivalent and correct:
Shell.define((plugin) => {
  const { $ } = plugin;
  return { n: $.kit.fmt.number(123) }; // via $ context
});

Shell.define((plugin) => {
  const { fmt } = plugin;
  return { n: fmt.number(123) }; // kit key hoisted to top level — equally valid
});

// With named deps (map form):
Shell.withDeps({ common: "shell/common" }).define((plugin) => {
  const { common, fmt } = plugin;
  return {
    text: common.greeting,
    n: fmt.number(123),
  };
});
```

**List form** — when using `Shell.withDeps("ns1", "ns2")` (positional strings).
The plugin is a **tuple**: deps come first, `$` is the last element. Kit keys
are NOT hoisted as tuple elements — use `$.kit.fmt`.

```ts
// Correct list form:
Shell.withDeps("shell/common").define((plugin) => {
  const [common, $] = plugin;
  return {
    text: common.greeting,
    n: $.kit.fmt.number(123), // must go through $
  };
});

// WRONG — fmt is not a tuple element:
Shell.withDeps("shell/common").define((plugin) => {
  const [fmt] = plugin;
  return {
    n: fmt.number(123), // ❌ runtime error
  };
});
```

Rule of thumb: if you destructure with `{ }`, kit keys are available directly.
If you destructure with `[ ]`, you must use `$` for the kit.

This rule applies equally to `InnerGear`, `BaseGear`, `OuterGear`, and `Shell`.

---

## Shell — multi-locale, factory form (with locale / kit / deps)

Use the factory form when the canonical shell needs dynamic logic, locale
access, kit helpers, or deps:

```ts
// shell/greeting/en.tsx
import { Shell, type RShape } from "../../setup";

// Map form — kit entry "fmt" hoisted to top level
export const r = Shell.define((plugin) => {
  const { fmt } = plugin;
  return {
    welcome: `Welcome!`,
    number: (n: number) => fmt.number(n),
  };
});

// Alternatively, via $:
// Shell.define((plugin) => {
//   const { $ } = plugin;
//   return { number: (n) => $.kit.fmt.number(n) };
// })

export type Shell_Greeting = RShape<typeof r>;
```

**Locale variant — plain object** (when the variant does not need kit/locale):

```ts
// shell/greeting/it.tsx
import { localized } from "../../setup";

export const r = localized("shell/greeting", {
  welcome: "Benvenuto!",
  number: (n: number) => n.toLocaleString("it-IT"),
});
```

**Locale variant — with kit access** (when the variant needs `fmt` or `$.locale`):

If a member (e.g. a formatting function) must use the kit formatter, the
variant file also needs a factory. Wrap `localized` in `Shell.define`:

```ts
// shell/greeting/it.tsx
import { localized, Shell } from "../../setup";

export const r = Shell.define((plugin) => {
  const { fmt } = plugin;
  return localized("shell/greeting", {
    welcome: "Benvenuto!",
    number: (n: number) => fmt.number(n), // uses kit formatter
  });
});
```

**When to use each variant form:**

- Plain `localized(...)` → when all members are static strings or pure TS
  expressions that don't need kit/locale at definition time.
- `Shell.define` wrapping `localized(...)` → when at least one member needs
  `fmt`, `$.locale`, or `$.ports`.

For variant files with async loading:

```ts
export const r = Shell.define(async (plugin) => {
  const { fmt } = plugin;
  const data = await loadTranslations("it");
  return localized("shell/greeting", {
    welcome: data.welcome,
    number: (n) => fmt.number(n),
  });
});
```

## Shell — multi-locale, with bridge gear dep

```ts
// shell/product/en.tsx
import { Shell, type RShape } from "../../setup";

// List form — dep first, $ last
export const r = Shell.withDeps("base/config") // base/config must be in bridgeGears in setup.ts
  .define((plugin) => {
    const [config, $] = plugin;
    return {
      apiInfo: `API: ${config.apiBase}`,
      currency: $.kit.fmt.number(99.99), // list form: kit via $
    };
  });

// Equivalent map form:
// Shell.withDeps({ config: "base/config" }).define((plugin) => {
//   const { config, fmt } = plugin;
//   return {
//     apiInfo: `API: ${config.apiBase}`,
//     currency: fmt.number(99.99),       // map form: kit key hoisted
//   };
// })

export type Shell_Product = RShape<typeof r>;
```

Variant files for a shell with deps use `localized` the same way (the runtime
supplies the dep; the variant only provides translation values).

## Shell — `shell(mono)` (locale-aware, single file, no variants)

Use for formatters, locale-aware helpers — no per-locale files:

```ts
// shell/lib/fmt.ts
import { Shell, type RShape } from "../../setup";

export const r = Shell.define((plugin) => {
  const { $ } = plugin;
  return {
    number: (n: number) => new Intl.NumberFormat($.locale).format(n),
    date: (d: Date) => new Intl.DateTimeFormat($.locale).format(d),
  };
});

export type Shell_Lib_Fmt = RShape<typeof r>;
```

---

## `resource-atlas.ts` update snippet

After creating the resource file(s), add two things to `resource-atlas.ts`:

```ts
// 1. Import (with other import type lines, keep alphabetical order)
import type { Outer_Cart } from "./outer/cart";

// 2. ResourceMap entry (inside type ResourceMap = { ... })
"outer/cart": Outer_Cart;
```

For multi-locale shells, the import path points to the canonical (default
locale) file:

```ts
import type { Shell_Product } from "./shell/product/en";
```

For internal namespaces (hidden from consumers), prefix the atlas key with `#`:

```ts
"#base/jwt": Base_Jwt;
```

The filesystem path does NOT include the `#` — the file lives at `base/jwt.ts`.

---

## Consuming a new resource (reminder for the user)

**React (`Plug`, sync):**

```tsx
import { Plug } from "@/r-machine/toolset";

export const plug = Plug("outer/cart");

export function CartButton() {
  const [cart] = plug.useR();
  return <button onClick={() => cart.add("item-1")}>{cart.count} items</button>;
}
```

**Next.js client (`ClientPlug`, sync):**

```tsx
"use client";
import { ClientPlug } from "@/r-machine/client-toolset";

export const plug = ClientPlug("outer/cart");
export function CartButton() {
  const [cart] = plug.useR();
  return <button onClick={() => cart.add("item-1")}>{cart.count} items</button>;
}
```

**Next.js server (`ServerPlug`, async):**

```tsx
import { ServerPlug } from "@/r-machine/server-toolset";

export const plug = ServerPlug("shell/product");
export default async function ProductPage({ params }) {
  const [product] = await plug.useR(params);
  return <h1>{product.title}</h1>;
}
```

**As a dep in another resource:**

```ts
OuterGear.withDeps("outer/cart").define((plugin, _) => {
  const [cart] = plugin;
  return {
    total: _.getter(() => cart.count * 10),
  };
});
```

## DirectPlug — container-free, locale passed explicitly (async, runs anywhere)

`Plug`/`ClientPlug` are bound to a React context; `ServerPlug` is bound to the
Next request scope (headers/cookies). `DirectPlug` is bound to **nothing**: you
pass the locale to `useR(locale)` yourself. Because it carries no container, it
runs **anywhere** — a server component, a client event handler, a queue worker,
a cron job, or a React Email template.

It comes from the **core toolset** (`rMachine.createToolset()`), so it is the same
import in React and Next. Deps are restricted to **shells + base gears** — exactly
the resources whose resolution is a pure function of locale (no inner/outer/vertex
gears, which need a state container).

```tsx
// emails/welcome.tsx — a React Email template, localized.
import { DirectPlug } from "@/r-machine/setup"; // or @/r-machine/toolset (React)

export const plug = DirectPlug("shell/email/welcome");
export async function WelcomeEmail({
  locale,
  name,
}: {
  locale: string;
  name: string;
}) {
  const [s, $] = await plug.useR(locale);

  // s        → the localized shell surface
  // $.locale → readonly echo of `locale` (pass it on to nested templates)
  // $.kit    → directKit resources (if configured)
  return (
    <Html lang={$.locale}>
      <Text>{s.greeting(name)}</Text>
    </Html>
  );
}
```

```ts
// Sending the email from a queue worker / route handler — no request scope needed:
import { render } from "@react-email/render";
const html = await render(
  await WelcomeEmail({ locale: user.locale, name: user.name }),
);
```

Notes:

- `useR` is **async**. On the client, call it in an async handler/effect — never
  directly in render (unlike the sync, Suspense-driven `ClientPlug`).
- To curate ambient shared resources for direct plugs, pass `directKit: { … }`
  to `RMachine.create(...)` (shell + base-gear namespaces only); they surface as
  `$.kit`.
- Prefer `ServerPlug` inside server components (it also gives `getPath`/`params`
  and auto-binds the locale from the request); reach for `DirectPlug` when there
  is **no** request/React context to bind to.
