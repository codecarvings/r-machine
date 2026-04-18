import { Gear, type RShape } from "../setup";

export const r = Gear.deps("gear/counter", "gear/shopping-cart", "prova")
  .reactive()
  .define(([counter, cart], _) => {
    return {
      mySum: _.getter("memoized", () => counter.myCount + cart.totalItems),
      doSomething: () => 21,
    };
  });

export type Gear_Aggregator = RShape<typeof r>;
