import { OuterGear, type RShape } from "../setup";

export const r = OuterGear.withDeps("outer/timer").define(([timer], _) => {
  return {
    negative: _.getter(() => -timer.value.value),
    plus10: () => timer.plus(10),
  };
});

export type Outer_Operator = RShape<typeof r>;
