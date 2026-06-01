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
  category: {
    all: "All products",
    // Localized labels for the locale-neutral category keys owned by the catalog.
    peripherals: "Peripherals",
    displays: "Displays",
    audio: "Audio",
  },
  viewDetails: "View details",
};

export type Shell_Catalog = RShape<typeof r>;
