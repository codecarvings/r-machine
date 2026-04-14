import { Forge, type RShape } from "../setup";

export const r = Forge.reactive({ counter: 0 }).vertexGear(async ({ $ }, _) => {
  const setSomeValue = _.action((value: number) => ({ counter: value }));

  const $myRelay = _.relay({
    select: () => ({
      myState: $.state.counter,
    }),
    onChange: (current) => {
      console.log("Counter value in relay:", current);
      if (current.myState > 5) {
        return _.cmd(setSomeValue, 0);
      }
    },
  });

  return {
    state: _.getter(),
    clear: _.action(() => ({ counter: 0 })),
    increment: _.action(() => ({ counter: $.state.counter + 1 })),
    double: _.getter(() => $.state.counter * 2),
    $internalAction: _.action(() => ({ counter: $.state.counter + 100 })),
    $relay1: $myRelay,
  };
});

export type Gear_ShoppingCart = RShape<typeof r>;
