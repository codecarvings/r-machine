import "server-only";
import { fetchProducts } from "@/lib/catalog-port";
import type { Category } from "@/r-machine/pub/base/store-config";
import { InnerGear, type RShape } from "@/r-machine/setup";

export interface Product {
  id: string;
  /** Locale-neutral. Only the UI chrome and the formatted price are localized. */
  name: string;
  category: Category;
  /** Canonical price; formatted per-locale (USD/EUR) by `shell/lib/fmt`. */
  price: number;
  blurb: string;
}

// An InnerGear is a stateless, app-global resource. It may depend on `base` and
// other `inner` gears, and is consumed only by server surfaces (`ServerPlug`).
// Here it owns the product catalog: an async `fetchProducts` port feeds it, so
// the factory is `async` and any server component reading it suspends until the
// products resolve.
export const r = InnerGear.withDeps("base/store-config")
  .withPorts({ fetchProducts })
  .define(async (plugin) => {
    const [store, $] = plugin;
    const products = await $.ports.fetchProducts();

    return {
      products,
      byId: (id: string): Product | undefined => products.find((p) => p.id === id),
      categories: store.categories,
    };
  });

export type Inner_Catalog = RShape<typeof r>;
