import { BaseGear, type RShape } from "../setup";

export const r = BaseGear.define(() => {
  return {
    sessionDuration: 30,
  };
});

export type Base_Config = RShape<typeof r>;
