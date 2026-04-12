import { mockPlug } from "@r-machine/testing";
import { Forge, type RShape } from "../setup";

export const r = Forge.connected({
  prova: "gear/aggregator",
})
  .reactive(0)
  .gear(({ $ }, _) => {
    return {
      increment: _.action(() => $.state + 1),
      decrement: _.action(() => $.state - 1),
      reset: _.action(() => $.defaultState),
      myCount: _.getter(() => $.state),
    };
  });

export type Gear_Counter = RShape<typeof r>;

mockPlug(r.plug, {
  $: {
    defaultState: 21,
    state: 33,
  },
  map: {
    prova: {
      mySum: 54,
    },
  },
});
