import { BaseGear, type RShape } from "../setup";

export const r = BaseGear.define(() => {
  return {
    name: "mid",
  };
});

export type Base_Mid = RShape<typeof r>;
