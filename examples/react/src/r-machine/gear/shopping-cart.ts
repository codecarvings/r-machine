import type { RShape } from "r-machine";
import { gear, RPlug } from "../setup";

export const plug = RPlug.reactive({
  counter: 0,
}).connect({
  prova: "shell/features/box_1_2",
});

export const r = gear(() => {
  const { $, _ } = plug.use();

  const clear = _.action(() => ({ counter: 0 }));
  _.cmd(clear);

  return _.surface({
    state: _.getter(),
    clear,
    increment: _.action(() => ({ counter: $.state.counter + 1 })),
    double: _.getter(() => $.state.counter * 2),
    $internal: _.action(() => ({ counter: $.state.counter + 100 })),
    doSomething: async () => {
      clear();
    },
  });
});

export type R_Gear_ShoppingCart = RShape<typeof r>;
