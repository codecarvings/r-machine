import type { Category } from "@/r-machine/pub/base/store-config";
import type { RShape } from "@/r-machine/setup";

// Plain-object shell (no `$` needed). The default-locale file can export the
// resource directly; other locales mirror its shape via `localized(...)`.
export const r = {
  heading: "Browse the store",
  subtitle: "A fake catalog showcasing every R-Machine primitive.",
  sort: {
    label: "Sort by",
    priceAsc: "Price: low to high",
    priceDesc: "Price: high to low",
    name: "Name",
  },
  allProducts: "All products",
  // Localized labels for the locale-neutral `Category` keys owned by `base/store-config`.
  // `satisfies` makes the table exhaustive: a new category without a label fails to compile.
  category: {
    peripherals: "Peripherals",
    displays: "Displays",
    audio: "Audio",
  } satisfies Record<Category, string>,
  viewDetails: "View details",
};

export type Shell_Catalog = RShape<typeof r>;
