import { OuterGear, type RShape } from "@/r-machine/setup";

// A client-session OuterGear: the interval and its lifecycle live in the gear,
// not in the component. `Symbol.dispose` clears it. The tick state survives
// locale navigation (the consumer keeps the same gear instance).
export const r = OuterGear.withDeps("base/config")
  .withState(0)
  .define((plugin, _) => {
    const [config, $] = plugin;

    const $inc = _.action(() => $.state + 1);
    const intervalId = setInterval(() => $inc(), config.tickIntervalMs);

    return {
      value: _.getter(() => $.state),
      [Symbol.dispose]: () => clearInterval(intervalId),
    };
  });

export type Outer_Timer = RShape<typeof r>;
