import { R, type RShape } from "../setup";

export const r = R.connected("gear/counter", "gear/shopping-cart")
  .reactive()
  .gear(async ([counter, cart], _) => {
    return {
      mySum: _.getter("memoized", () => counter.myCount + cart.totalItems),
      doSomething: () => 21,
    };
  });

export type Gear_Aggregator = RShape<typeof r>;
