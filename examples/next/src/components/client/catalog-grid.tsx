"use client";

import { useMemo } from "react";
import { ProductCard } from "@/components/client/product-card";
import { ClientPlug } from "@/r-machine/client-toolset";
import type { Product } from "@/r-machine/prv/inner/catalog";

// Reads the SHARED `vertex/catalog-filter` instance (shared via the parent's
// <VertexFrame>) plus `shell/catalog`. Sorting/filtering happens client-side and
// reactively: when the filter bar mutates the vertex state, this grid re-renders
// instantly — no navigation, no server round-trip.
const plug = ClientPlug("vertex/catalog-filter", "shell/catalog");
export function CatalogGrid({ products }: { products: Product[] }) {
  const [filter, s, $] = plug.useR();
  const { fmt } = $.kit;

  // Filtering and price sorting stay HERE, in the component, on purpose: they
  // are presentation logic over a plain prop — no lifetime, no scope, no
  // locale — so they are not resources. (A `_.cell` on the vertex could not see
  // `products` anyway: `outer -> inner` is forbidden and `inner/catalog` is
  // server-only, so pushing the props into gear state is the only way, and that
  // duplicates data RSC already owns.) The one genuinely locale-dependent
  // piece — collating names — IS a resource, and comes from `shell/lib/fmt`.
  const visible = useMemo(() => {
    const list = filter.category ? products.filter((p) => p.category === filter.category) : products;
    const sorted = [...list];
    if (filter.sort === "price-asc") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (filter.sort === "price-desc") {
      sorted.sort((a, b) => b.price - a.price);
    } else {
      sorted.sort((a, b) => fmt.compare(a.name, b.name));
    }
    return sorted;
  }, [products, filter.category, filter.sort, fmt]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {visible.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          // Same canonical number, locale-aware currency/format.
          priceLabel={fmt.currency(p.price)}
          categoryLabel={s.category[p.category]}
          viewDetailsLabel={s.viewDetails}
          href={$.getPath("/product/[id]", { id: p.id })}
        />
      ))}
    </div>
  );
}
CatalogGrid.plug = plug;
