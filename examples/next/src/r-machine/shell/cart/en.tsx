import type { RShape } from "@/r-machine/setup";

export const r = {
  title: "Your cart",
  // Plural word forms consumed by `fmt.plural(count, one, other)`.
  itemWord: { one: "item", other: "items" },
  subtotal: "Subtotal",
  remove: "Remove",
  checkout: "Checkout",
  empty: "Your cart is empty.",
  continueShopping: "Continue shopping",
};

export type Shell_Cart = RShape<typeof r>;
