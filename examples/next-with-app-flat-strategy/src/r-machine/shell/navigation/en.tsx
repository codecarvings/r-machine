import type { RShape } from "@/r-machine/setup";

export const r = {
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
  helloWorld: {
    label: "Hello world",
    description: "Non-localized route (no locale prefix)",
  },
};

export type Shell_Navigation = RShape<typeof r>;
