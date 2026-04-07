import { GearPlug, type R } from "../setup";

export const plug = GearPlug("gear/counter", "gear/shopping-cart").reactive();

export const r = plug.Gear(() => {
  const [counter, shoppingCart, $, _] = plug.use();

  return {
    mySum: _.getter(() => counter.myCount + shoppingCart.totalItems),
  };
});

export type Gear_Aggregator = R<typeof r>;
