import type { R } from "r-machine";

const r = {
  home: "Home",
  exampleStatic: {
    label: "Static Routes",
    page1: {
      label: "Page 1",
      description: "2-level nested static route",
    },
    page2: {
      label: "Page 2",
      description: "Another nested static route",
    },
  },
  exampleDynamic: {
    label: "Dynamic Routes",
    description: "Routes with [slug] parameter",
  },
};

export default r;
export type R_Navigation = R<typeof r>;
