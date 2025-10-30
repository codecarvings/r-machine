import type { R } from "r-machine";

const r = {
  box1: {
    title: "Fast & Lightweight",
    description: "Optimized for performance with minimal bundle size",
  },
  box2: {
    title: "Type-Safe",
    description: "Full TypeScript support with intelligent autocomplete",
  },
};

export default r;
export type R_Boxes_Box_1_2 = R<typeof r>;
