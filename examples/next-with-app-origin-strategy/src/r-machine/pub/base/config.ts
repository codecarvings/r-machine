import { BaseGear, type RShape } from "@/r-machine/setup";

// The ONLY content that differs between the four `next-with-app-*-strategy`
// examples lives here (plus `setup.ts` and `path-atlas.ts`). The hero badge
// reads `strategyName`; the `outer/timer` gear reads `tickIntervalMs`.
export const r = BaseGear.define(() => {
  return {
    strategyName: "Origin strategy",
    tickIntervalMs: 1000,
  };
});

export type Base_Config = RShape<typeof r>;
