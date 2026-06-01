import { OuterGear, type RShape } from "../setup";

export const r = OuterGear.withDeps({ config: "base/config" })
  .withState(0)
  .define((plugin, _) => {
    const { config, $ } = plugin;
    const $inc = _.action(() => $.state + 1);
    const intervalId = setInterval(() => {
      $inc();
    }, 1000);

    return {
      $inc,
      value: _.getter(),
      valueWithConfigName: _.cell(() => `${config.appName}: ${$.state}`),
      [Symbol.dispose]: () => {
        clearInterval(intervalId);
      },
      $relay: _.relay({
        select: () => $.state,
        onChange: (newValue: number) => {
          if (newValue % 5 === 0) {
            console.log(`Value ${newValue} is a multiple of 5!`);
          }
        },
      }),
    };
  });

export type Outer_Timer = RShape<typeof r>;
