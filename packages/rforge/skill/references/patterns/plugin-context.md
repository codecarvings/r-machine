# R-Machine Patterns — Plugin context: map form vs list form (crucial distinction)

This rule applies equally to `InnerGear`, `BaseGear`, `OuterGear`, and `Shell`.
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
