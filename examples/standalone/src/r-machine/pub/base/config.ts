import { BaseGear, type RShape } from "@/r-machine/setup.ts";

// Stateless, app-global config — a base gear DirectPlug can consume directly.
export const r = BaseGear.define(() => ({
  appName: "R-Machine Standalone",
}));

export type Base_Config = RShape<typeof r>;
