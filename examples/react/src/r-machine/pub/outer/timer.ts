import { OuterGear, type RShape } from "@/r-machine/setup";

// Reactive client-session state. Shows every OuterGear building block:
// action, getter, memoized cell, relay (derives `isOdd` from `value`),
// a gear→gear dependency on `base/config`, and `Symbol.dispose` cleanup.
export const r = OuterGear.withDeps("base/config")
  .withState({ value: 0, isOdd: false })
  .define((plugin, _) => {
    const [config, $] = plugin;

    const $inc = _.action(() => ({ value: $.state.value + 1 }));
    const intervalId = setInterval(() => $inc(), config.tickIntervalMs);

    const setIsOdd = _.action((isOdd: boolean) => ({ isOdd }));
    _.relay({
      select: () => $.state.value,
      onChange: (value) => _.cmd(setIsOdd, value % 2 === 1),
    });

    return {
      value: _.getter(() => $.state.value),
      isOdd: _.getter(() => $.state.isOdd),
      doubled: _.cell(() => $.state.value * 2),
      add: _.action((n: number) => ({ value: $.state.value + n })),
      [Symbol.dispose]: () => clearInterval(intervalId),
    };
  });

export type Outer_Timer = RShape<typeof r>;
