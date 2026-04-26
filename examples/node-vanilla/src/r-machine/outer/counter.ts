import { OuterGear, type RShape } from "../setup.js";

export const r = OuterGear.withState(0).define(({ $ }, _) => {
  return {
    increment: _.action(() => $.state + 1),
    decrement: _.action(() => $.state - 1),
    reset: _.action(() => $.defaultState),
    myCount: _.getter(() => $.state),
  };
});

export type Outer_Counter = RShape<typeof r>;
