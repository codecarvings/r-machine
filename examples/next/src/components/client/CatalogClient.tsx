"use client";

import { ClientPlug, VertexFrame } from "@/r-machine/client-toolset";
import type { Product } from "@/r-machine/inner/catalog";
import { CatalogFilterBar } from "./CatalogFilterBar";
import { CatalogGrid } from "./CatalogGrid";

// Resolves ONE `vertex/catalog-filter` instance and shares it — via <VertexFrame>
// — with the filter bar and the grid below. Without the frame each consumer would
// get its own independent vertex instance; with it, both read and write the same
// reactive filter state.
export const plug = ClientPlug({ filter: "vertex/catalog-filter" });

export function CatalogClient({ products, categories }: { products: Product[]; categories: readonly string[] }) {
  const { filter } = plug.useR();

  return (
    <VertexFrame gear={[filter]}>
      <CatalogFilterBar categories={categories} />
      <CatalogGrid products={products} />
    </VertexFrame>
  );
}
