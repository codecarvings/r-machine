# R-Machine Patterns — BaseGear

Code templates for the `gear:base` family. For the map-form vs list-form plugin
rule see [plugin-context.md](./plugin-context.md); to test a BaseGear see
[../testing.md](../testing.md).

---

> Client-safe `base/` resources live under `src/r-machine/pub/base/`.

## BaseGear — static, no deps

```ts
// src/r-machine/pub/base/config.ts
import { BaseGear, type RShape } from "@/r-machine/setup";

export const r = BaseGear.define(() => ({
  apiBase: "https://api.example.com",
  timeout: 5000,
}));

export type Base_Config = RShape<typeof r>;
```

## BaseGear — with deps (list form)

```ts
// src/r-machine/pub/base/http.ts
import { BaseGear, type RShape } from "@/r-machine/setup";

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
// src/r-machine/pub/base/db.ts
import { BaseGear, type RShape } from "@/r-machine/setup";
import { createClient } from "@/lib/db";

export const r = BaseGear.withPorts({ createClient }).define((plugin) => {
  const { $ } = plugin;
  return {
    query: async (sql: string) => $.ports.createClient().query(sql),
  };
});

export type Base_Db = RShape<typeof r>;
```

---

## Test it

```ts
import { mockPlug } from "@r-machine/testing";
import { r } from "@/r-machine/pub/base/config";

it("exposes its values", async () => {
  using ctrl = mockPlug(r).default();
  const config = await ctrl.createRes();
  expect(config.apiBase).toBe("https://api.example.com");
});
```

With ports, substitute them: `.with({ $: { ports: { createClient: () => fake } } })`.
See [../testing.md](../testing.md).
