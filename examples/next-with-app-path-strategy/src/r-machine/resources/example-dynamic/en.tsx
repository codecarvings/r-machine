const r = {
  list: {
    title: "Dynamic Routes",
    description: "This page lists items with dynamic slugs",
    feature: "Uses getPath('/example-dynamic/[slug]', { slug }) for type-safe dynamic links",
  },
  items: [
    { slug: "slug-1", title: "Dynamic Item 1" },
    { slug: "slug-2", title: "Dynamic Item 2" },
    { slug: "slug-3", title: "Dynamic Item 3" },
  ],
  detail: {
    backLink: "Back to list",
    feature: "Dynamic [slug] parameter extracted from URL params",
  },
};

export default r;
export type R_ExampleDynamic = typeof r;
