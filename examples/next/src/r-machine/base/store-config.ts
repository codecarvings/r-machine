import { BaseGear, type RShape } from "../setup";

// A BaseGear is a stateless, juncture-scoped resource: created once and shared
// across every consumer in a render. Perfect for store-wide configuration that
// inner gears (catalog) and outer gears (cart, filter) depend on.
export const r = BaseGear.define(() => ({
  storeName: "R-Mart",
  supportedCurrencies: ["USD", "EUR"] as const,
  defaultSort: "price-asc" as "price-asc" | "price-desc" | "name",
  categories: ["peripherals", "displays", "audio"] as const,
}));

export type Base_StoreConfig = RShape<typeof r>;
