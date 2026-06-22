# R-Machine Patterns — InnerGear (Next.js server-only)

Same chain as `BaseGear`. Only `ServerPlug` can consume it.
Cannot be consumed by `Plug` or `ClientPlug`. For the map-form vs list-form
plugin rule see [plugin-context.md](./plugin-context.md); to test an InnerGear
see [../testing.md](../testing.md).

```ts
import { InnerGear, type RShape } from "../setup";

export const r = InnerGear.define(() => ({
  getSecret: () => process.env.SECRET_KEY!,
}));

export type Inner_Secrets = RShape<typeof r>;
```

## InnerGear — async factory (resolve via a port)

The factory may be `async` — e.g. await a server-only port. A `ServerPlug`
consumer suspends until it resolves.

```ts
import { InnerGear, type RShape } from "../setup";
import { fetchProducts } from "../lib/products"; // server-only

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
import { r } from "@/r-machine/inner/catalog";

it("resolves through the mocked port; real deps stay real", async () => {
  using _ctrl = mockPlug(r).with({
    $: { ports: { fetchProducts: async () => FIXTURES } },
  });
  const catalog = await r.create();
  expect(catalog.byId("b")?.name).toBe("Beta");
});
```

Stateless → `using` just exits test mode at scope end. See [../testing.md](../testing.md).
