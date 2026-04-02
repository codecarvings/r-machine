import type { RShape } from "r-machine";

export const r = {
  box1: {
    title: "Type-Safe Translations",
    description: (
      <>
        <span className="font-semibold">Full TypeScript support with auto-completion and compile-time validation.</span>
        Catch missing translations before they reach production.
      </>
    ),
    badge: "TypeScript",
  },
  box2: {
    title: "Minimal Runtime Cost",
    description: (
      <>
        <span className="font-semibold">Access translations as simple object properties without string parsing.</span>
        Only load the namespaces you need.
      </>
    ),
    badge: "Performance",
  },
};

export type R_Shell_Features_Box_1_2 = RShape<typeof r>;
