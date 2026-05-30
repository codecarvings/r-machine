import { OuterGear, type RShape } from "../setup";

export const r = OuterGear.withDeps("#base/config")
  .withState(0)
  .define((plugin, _) => {
    const [config, $] = plugin;
    const $inc = _.action(() => $.state + 1);
    const intervalId = setInterval(() => {
      $inc();
    }, 1000);

    const marker = "X";

    return {
      $inc,
      value: _.getter(),
      valueWithConfig: _.getter(() => {
        return `${config.sessionDuration} - ${marker} - ${$.state}`;
      }),
      [Symbol.dispose]: () => {
        clearInterval(intervalId);
      },
    };
  });

export type Outer_Timer = RShape<typeof r>;
