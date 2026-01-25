import type { R_Navigation } from "./en";

const r: R_Navigation = {
  home: "Home",
  exampleStatic: {
    label: "Route Statiche",
    page1: {
      label: "Pagina 1",
      description: "Route statica annidata a 2 livelli",
    },
    page2: {
      label: "Pagina 2",
      description: "Altra route statica annidata",
    },
  },
  exampleDynamic: {
    label: "Route Dinamiche",
    description: "Route con parametro [slug]",
  },
};

export default r;
