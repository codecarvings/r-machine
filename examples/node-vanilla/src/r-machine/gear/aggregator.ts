import { mockPlug } from "@r-machine/testing";
import { Gear } from "../setup";

export const r = Gear.deps("gear/counter", "gear/shopping-cart")
  .reactive()
  .define(([counter, cart], _) => {
    return {
      mySum: _.getter("memoized", () => counter.myCount + cart.totalItems),
      doSomething: () => 21,
    };
  });

mockPlug(r.plug).with({
  0: {
    myCount: () => 10,
  },
});

export type Gear_Aggregator = ReturnType<typeof r>;
