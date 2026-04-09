import { R, type RShape } from "../setup";

export const r = R.reactive(0).gear(({ $ }, _) => {
  return {
    increment: _.action(() => $.state + 1),
    decrement: _.action(() => $.state - 1),
    reset: _.action(() => $.defaultState),
    myCount: _.getter(() => $.state),
  };
});

export type Gear_Counter = RShape<typeof r>;
