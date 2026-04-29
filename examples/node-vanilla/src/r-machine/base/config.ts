import { BaseGear, type RShape } from "../setup.js";

export const r = BaseGear.define(() => {
  return {
    someData: true,
  };
});

export type Base_Config = RShape<typeof r>;
