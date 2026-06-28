import { BaseGear, type RShape } from "@/r-machine/setup";

// Stateless, app-global config. A BaseGear other gears depend on
// (the timer reads `tickIntervalMs`).
export const r = BaseGear.define(() => {
  return {
    appName: "R-Machine × React",
    tickIntervalMs: 1000,
  };
});

export type Base_Config = RShape<typeof r>;
