import type { R_ExampleDynamic } from "./en";

const r: R_ExampleDynamic = {
  list: {
    title: "Route Dinamiche",
    description: "Questa pagina elenca elementi con slug dinamici",
    feature: "Usa getPath('/example-dynamic/[slug]', { slug }) per link dinamici type-safe",
  },
  items: [
    { slug: "slug-1", title: "Elemento Dinamico 1" },
    { slug: "slug-2", title: "Elemento Dinamico 2" },
    { slug: "slug-3", title: "Elemento Dinamico 3" },
  ],
  detail: {
    backLink: "Torna alla lista",
    feature: "Parametro dinamico [slug] estratto dai params URL",
  },
};

export default r;
