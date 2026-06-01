import { OuterGear, type RShape } from "../setup";

export type CatalogSort = "price-asc" | "price-desc" | "name";

// A Vertex gear is an OuterGear with request/page scope: each consumption site
// (or `VertexFrame`) gets an independent, reactive instance whose lifetime is
// the request, not the browser session. Ideal for transient page UI state like
// the catalog sort/category selection — it must NOT survive navigation the way
// the cart does.
export const r = OuterGear.withDeps({ store: "base/store-config" })
  .withState({ sort: "price-asc" as CatalogSort, category: null as string | null })
  .define((plugin, _) => {
    const { store, $ } = plugin;

    // Seed the initial sort from store config.
    _.action()({ sort: store.defaultSort });

    return {
      sort: _.getter(() => $.state.sort),
      category: _.getter(() => $.state.category),
      setSort: _.action((sort: CatalogSort) => ({ sort })),
      setCategory: _.action((category: string | null) => ({ category })),
    };
  });

export type Vertex_CatalogFilter = RShape<typeof r>;
