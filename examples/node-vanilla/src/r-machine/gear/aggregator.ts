import { mockPlug } from "@r-machine/testing";
import { Forge, type RShape } from "../setup";

export const r = Forge.connected("gear/counter", "gear/shopping-cart")
  .reactive()
  .gear(([counter, cart], _) => {
    return {
      mySum: _.getter("memoized", () => counter.myCount + cart.totalItems),
      doSomething: () => 21,
    };
  });

export type Gear_Aggregator = RShape<typeof r>;

mockPlug(r.plug).with({
  0: {
    myCount: () => 10,
  },
});
