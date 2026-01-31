import type { R_ExampleStatic } from "./en";

const r: R_ExampleStatic = {
  page1: {
    title: "Pagina Statica 1",
    description: "Questa pagina dimostra una route statica annidata a 2 livelli: /example-static/page-1",
    feature: "Usa getPathComposer() per generare link locale-aware",
  },
  page2: {
    title: "Pagina Statica 2",
    description: "Un'altra route statica annidata a 2 livelli: /example-static/page-2",
    feature: "Usa getPathComposer() per generare link locale-aware",
  },
};

export default r;
