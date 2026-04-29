import { BaseGear, type RShape } from "@/r-machine/setup";

export const r = BaseGear.define(() => {
  return {
    timer: 0,
  };
});

export type Base_Timer = RShape<typeof r>;
