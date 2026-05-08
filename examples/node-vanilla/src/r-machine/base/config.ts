import { BaseGear, type RShape } from "../setup.js";

export const r = BaseGear.withDeps("base/mid").define(([mid]) => {
  return {
    someData: mid.name,
  };
});

export type Base_Config = RShape<typeof r>;
