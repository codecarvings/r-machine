# R-Machine Patterns — Plugin context: map form vs list form (crucial distinction)

Deps are declared **positionally** — `withDeps("ns1", "ns2")`, `Plug("ns1", "ns2")` —
or **by name** — `withDeps({ a: "ns1" })`, `Plug({ a: "ns1" })`. Both forms are
accepted everywhere: on `InnerGear`, `BaseGear`, `OuterGear`, `Shell`, and on every
consumer plug. The form you pick decides the **shape of the `plugin` argument**, and
therefore how you reach kit entries like `fmt`.

## Choosing the form — count the deps

**Up to 2 deps: list form. From 3 deps up: map form.** Decide by counting, not by
judgement — the compiler accepts either form everywhere, so it will not correct a
wrong choice. (With no deps at all there is nothing to name; the plugin is an object
either way.)

Up to two, position is self-evident at the destructuring site: `const [timer, t, $] =`
lines up with `Plug("outer/timer", "shell/timer")` at a glance. From the third dep on
it stops being self-evident — the reader counts elements against the declaration to
learn which surface is which — and **inserting a dep shifts every later position**, at
the destructuring site and in every test override, which the list form keys by index.

## What follows from the choice

- **Kit access.** The map form hoists kit entries as top-level keys of the plugin
  (`const { common, fmt } = plugin`); the list form does not — kit goes through
  `$.kit.fmt`. See the two sections below: getting this wrong is a runtime error, not
  a type error.
- **Test overrides.** `mockPlug(...).with({ … })` keys resolution overrides the same
  way the deps are declared: by name for the map form (`{ shared: { … } }`), by index
  for the list form (`{ 0: { … } }`). See [../testing.md](../testing.md).
- **Renames.** A map-form name is chosen once at the declaration and is what both the
  body and the test fixtures refer to, so renaming the underlying namespace touches
  only the declaration.

## Map form — the plugin is an object

Default when using `Shell.define(...)` with no args, or `Shell.withDeps({ key: "ns" })`.
All kit entries are hoisted as top-level keys alongside any named deps and `$`.

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
Shell.withDeps({
  common: "shell/common",
  cart: "shell/cart",
  product: "shell/product",
}).define((plugin) => {
  const { common, cart, fmt } = plugin;
  return {
    text: common.greeting,
    n: fmt.number(123),
  };
});
```

## List form — the plugin is a tuple

When using `Shell.withDeps("ns1", "ns2")` (positional strings). Deps come first, `$`
is the last element. Kit keys are NOT hoisted as tuple elements — use `$.kit.fmt`.

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

## The same rule on a consumer plug

Every example above is a declaration site, but the form decides the shape of
`useR()`'s result in exactly the same way — the plugin type is shared. Kit access
on a consumer is not an analogy; it is the same rule.

```tsx
// List form — a tuple: deps first, `$` last. The kit goes through `$`.
const plug = Plug("outer/cart", "shell/cart");
const [cart, s, $] = plug.useR();
$.kit.fmt.currency(cart.subtotal);

// Map form — an object: named deps, `$`, and the kit keys alongside them.
const plug = Plug({ cart: "outer/cart", copy: "shell/cart", nav: "shell/nav" });
const { cart, copy, fmt, $ } = plug.useR();
fmt.currency(cart.subtotal); // same surface as $.kit.fmt.currency(...)
```

`$.kit.<entry>` works in **both** forms, so it is the safe default when you are
unsure. One catch in the map form: **a dep name shadows a kit key of the same
name.** Name a dep `fmt` and the top-level `fmt` is that dep — the kit entry is
then reachable only as `$.kit.fmt`.

Rule of thumb: if you destructure with `{ }`, kit keys are available directly.
If you destructure with `[ ]`, you must use `$` for the kit.
