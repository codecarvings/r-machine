import type { RShape } from "@/r-machine/setup";

export const r = {
  addToCart: "Add to cart",
  added: "Added ✓",
  backToCatalog: "← Back to catalog",
  inStock: "In stock",
  category: "Category",
};

export type Shell_Product = RShape<typeof r>;
