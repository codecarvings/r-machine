import { R, type RShape } from "../setup";

export const r = R.connected("gear/counter", "gear/shopping-cart")
  .reactive()
  .gear(([counter, cart], _) => {
    return {
      mySum: _.getter("memoized", () => counter.myCount + cart.totalItems),
    };
  });

export type Gear_Aggregator = RShape<typeof r>;
