import { ReactivePlug } from "../setup";

export const plug = ReactivePlug("gear/counter", "gear/shopping-cart").stateless();

export const r = plug.Gear(() => {
  const [counter, shoppingCart, $, _] = plug.use();

  return {
    mySum: _.getter(() => counter.myCount + shoppingCart.totalItems),
  };
});

export type Gear_Aggregator = ReturnType<typeof r>;
