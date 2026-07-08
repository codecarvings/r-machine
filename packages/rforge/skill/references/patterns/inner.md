# R-Machine Patterns — InnerGear (Next.js server-only)

Same chain as `BaseGear`. Only `ServerPlug` can consume it.
Cannot be consumed by `Plug` or `ClientPlug`. As a server-only family, `inner/`
gears live under `src/r-machine/prv/inner/` (the `prv/` folder is server-fenced
and never reaches the client bundle). For the map-form vs list-form plugin rule
see [plugin-context.md](./plugin-context.md); to test an InnerGear see
[../testing.md](../testing.md).

```ts
// src/r-machine/prv/inner/secrets.ts
import { InnerGear, type RShape } from "@/r-machine/setup";

export const r = InnerGear.define(() => ({
  getSecret: () => process.env.SECRET_KEY!,
}));

export type Inner_Secrets = RShape<typeof r>;
```

## InnerGear — async factory (resolve via a port)

The factory may be `async` — e.g. await a server-only port. A `ServerPlug`
consumer suspends until it resolves.

```ts
// src/r-machine/prv/inner/catalog.ts
import { InnerGear, type RShape } from "@/r-machine/setup";
import { fetchProducts } from "@/lib/products"; // server-only

export const r = InnerGear.withPorts({ fetchProducts }).define(
  async (plugin) => {
    const { $ } = plugin;
    const products = await $.ports.fetchProducts();
    return {
      products,
      byId: (id: string) => products.find((p) => p.id === id),
    };
  },
);

export type Inner_Catalog = RShape<typeof r>;
```

---

## Test it

```ts
import { mockPlug } from "@r-machine/testing";
import { r } from "@/r-machine/prv/inner/catalog";

it("resolves through the mocked port; real deps stay real", async () => {
  using ctrl = mockPlug(r).with({
    $: { ports: { fetchProducts: async () => FIXTURES } },
  });
  const catalog = await ctrl.createRes();
  expect(catalog.byId("b")?.name).toBe("Beta");
});
```

Stateless → `using` just exits test mode at scope end. See [../testing.md](../testing.md).
