import type { RShape } from "@/r-machine/setup";

export const r = {
  page1: {
    title: "Static Page 1",
    description: "This page demonstrates a 2-level nested static route: /example-static/page-1",
    feature: "Uses $.getPath() to generate locale-aware links",
  },
  page2: {
    title: "Static Page 2",
    description: "Another 2-level nested static route: /example-static/page-2",
    feature: "Uses $.getPath() to generate locale-aware links",
  },
};

export type Shell_ExampleStatic = RShape<typeof r>;
