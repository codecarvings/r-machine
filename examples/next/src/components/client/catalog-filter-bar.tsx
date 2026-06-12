"use client";

import { Button } from "@/components/ui/button";
import { ClientPlug } from "@/r-machine/client-toolset";
import type { CatalogSort } from "@/r-machine/vertex/catalog-filter";

// Reads the same shared `vertex/catalog-filter` instance as <CatalogGrid>. Its
// writes (setSort/setCategory) drive the grid's re-render — the two siblings
// share one reactive vertex instance because the parent wraps them in a
// <VertexFrame>.
export const plug = ClientPlug("vertex/catalog-filter", "shell/catalog");
export function CatalogFilterBar({ categories }: { categories: readonly string[] }) {
  const [filter, s] = plug.useR();

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter.category === null ? "default" : "outline"}
          size="sm"
          onClick={() => filter.setCategory(null)}
        >
          {s.category.all}
        </Button>
        {categories.map((c) => (
          <Button
            key={c}
            variant={filter.category === c ? "default" : "outline"}
            size="sm"
            onClick={() => filter.setCategory(c)}
          >
            {s.category[c as keyof typeof s.category]}
          </Button>
        ))}
      </div>
      <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
        {s.sort.label}
        <select
          className="border rounded-md px-2 py-1 bg-background text-foreground"
          value={filter.sort}
          onChange={(e) => filter.setSort(e.target.value as CatalogSort)}
        >
          <option value="price-asc">{s.sort.priceAsc}</option>
          <option value="price-desc">{s.sort.priceDesc}</option>
          <option value="name">{s.sort.name}</option>
        </select>
      </label>
    </div>
  );
}
