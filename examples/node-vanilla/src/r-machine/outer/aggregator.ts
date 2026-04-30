import { OuterGear, type RShape } from "../setup.js";

export const r = OuterGear.withDeps("outer/counter", "outer/shopping-cart").define(([counter, cart], _) => {
  return {
    mySum: _.getter("memoized", () => counter.myCount + cart.totalItems),
    doSomething: () => 21,
  };
});

export type Outer_Aggregator = RShape<typeof r>;
