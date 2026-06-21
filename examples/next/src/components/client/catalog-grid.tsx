"use client";

import { useMemo } from "react";
import { ProductCard } from "@/components/client/product-card";
import { ClientPlug } from "@/r-machine/client-toolset";
import type { Product } from "@/r-machine/inner/catalog";

// Reads the SHARED `vertex/catalog-filter` instance (shared via the parent's
// <VertexFrame>) plus `shell/catalog`. Sorting/filtering happens client-side and
// reactively: when the filter bar mutates the vertex state, this grid re-renders
// instantly — no navigation, no server round-trip.
const plug = ClientPlug("vertex/catalog-filter", "shell/catalog");
export function CatalogGrid({ products }: { products: Product[] }) {
  const [filter, s, $] = plug.useR();

  const visible = useMemo(() => {
    const list = filter.category ? products.filter((p) => p.category === filter.category) : products;
    const sorted = [...list];
    if (filter.sort === "price-asc") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (filter.sort === "price-desc") {
      sorted.sort((a, b) => b.price - a.price);
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [products, filter.category, filter.sort]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {visible.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          // The "wow" line: same canonical number, locale-aware currency/format.
          priceLabel={$.kit.fmt.currency(p.price)}
          categoryLabel={s.category[p.category as keyof typeof s.category]}
          viewDetailsLabel={s.viewDetails}
          href={$.getPath("/product/[id]", { id: p.id })}
        />
      ))}
    </div>
  );
}
CatalogGrid.plug = plug;
