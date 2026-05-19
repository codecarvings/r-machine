import { managed } from "r-machine";
import { OuterGear, type RShape } from "../setup";

export const r = OuterGear.withState({
  value: 0,
  isOdd: false,
}).define(({ $ }, _) => {
  const $inc = _.action(() => ({
    value: $.state.value + 1,
  }));
  const intervalId = setInterval(() => {
    $inc();
  }, 1000);

  const setIsOdd = _.action((isOdd: boolean) => ({
    isOdd,
  }));

  _.relay({
    select: () => $.state.value,
    onChange: (current) => {
      return _.cmd(setIsOdd, current % 2 === 1);
    },
  });

  return managed(
    {
      $inc,
      value: _.getter(),
      plus: _.action((n: number) => ({
        value: $.state.value + n,
      })),
    },
    () => {
      clearInterval(intervalId);
    }
  );
});

export type Outer_Timer = RShape<typeof r>;
