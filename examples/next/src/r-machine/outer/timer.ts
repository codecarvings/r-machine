import { OuterGear, type RShape } from "../setup";

export const r = OuterGear.withState(0).define(({ $ }, _) => {
  const $inc = _.action(() => $.state + 1);
  const intervalId = setInterval(() => {
    $inc();
  }, 1000);

  return {
    $inc,
    value: _.getter(),
    [Symbol.dispose]: () => {
      clearInterval(intervalId);
    },
  };
});

export type Outer_Timer = RShape<typeof r>;
