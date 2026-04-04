import { Gear, type R } from "@/r-machine/setup";

// Versione Reactive
const wire = reactive({
  counter: 0,
}).connect();

// Versione normale
const deps = Deps();

// Creazione Gear
export const { r, plug } = Gear(deps, () => {
  const { $, _ } = plug.use();

  const setSomeValue = _.action((value: number) => ({ counter: value }));

  const relay1 = _.relay({
    select: () => ({
      myState: $.state.counter,
    }),
    onChange: (current) => {
      console.log("Counter value in relay:", current);
      if (current.myState >= 5) {
        return _.cmd(setSomeValue, 21);
      }
    },
  });

  return {
    state: _.getter(),
    clear: _.action(() => ({ counter: 0 })),
    increment: _.action(() => ({ counter: $.state.counter + 1 })),
    double: _.getter(() => $.state.counter * 2),
    $internal: _.action(() => ({ counter: $.state.counter + 100 })),
    relay1,
  };
});

export type Gear_ShoppingCart = R<typeof r>;
