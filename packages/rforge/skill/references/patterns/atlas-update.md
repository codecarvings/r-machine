# R-Machine Patterns — `resource-atlas.ts` update snippet

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

## Internal namespaces (`#` marker)

Prefix an atlas key with `#` to make a namespace **internal** — visible inside the
resource network (a `withDeps(...)` target for other gears/shells, referenceable
from `gearKit`/`shellKit`) but **filtered out of every consumer plug** surface
(`Plug`/`ClientPlug`/`ServerPlug`/`DirectPlug`). Use it for utility resources that
should never appear in UI code (JWT/crypto helpers, server-only adapters).

```ts
"#base/jwt": Base_Jwt;
```

Rules:

- The `#` must be the **first character** (`"#base/jwt"`); mid-string is ignored.
- It is a **type-level marker only** — never in filesystem paths or `load`. The
  file lives at `base/jwt.ts`; `load` receives the unmarked `base/jwt`.
- Layout classification is unchanged (`#base/jwt` still resolves to `gear:base`).
- Factory kits (`gearKit`/`shellKit`) may reference `#` namespaces; consumer kits
  (`kit`/`clientKit`/`serverKit`) may **not** (compile error).
- Use the same string everywhere a handle is needed: `withDeps("#base/jwt")`,
  `token("#base/jwt")`, `bridgeGears: ["#base/jwt"]`.

## Keep the token builder

Leave the `const token = ResourceAtlas.getTokenBuilder();` line in place after the
class — it runs the atlas's compile-time self-check (a `ResourceMap` key that
doesn't match a layout prefix is a compile error), so it is the first thing that
catches a malformed entry. Optionally export a typed token for the new resource
(for kit / token-form dep declarations):

```ts
export const cart = token("outer/cart");
```
