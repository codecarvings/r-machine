import { mockPlug } from "@r-machine/testing";
import { Gear, type RShape } from "../setup";

export const r = Gear.deps({
  prova: "gear/aggregator",
})
  .reactive(0)
  .define(({ $ }, _) => {
    return {
      increment: _.action(() => $.state + 1),
      decrement: _.action(() => $.state - 1),
      reset: _.action(() => $.defaultState),
      myCount: _.getter(() => $.state),
    };
  });

export type Gear_Counter = RShape<typeof r>;

mockPlug(r.plug).with({
  $: {
    defaultState: 21,
    state: 21,
  },
  prova: {
    mySum: () => 31,
  },
});
