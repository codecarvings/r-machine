import { managed } from "r-machine";
import { OuterGear, type RShape } from "../setup";

export const r = OuterGear.withState(0).define(({ $ }, _) => {
  const $inc = _.action(() => $.state + 1);
  const intervalId = setInterval(() => {
    $inc();
  }, 1000);

  return managed(
    {
      $inc,
      value: _.getter(() => $.state * -4),
    },
    () => {
      clearInterval(intervalId);
    }
  );
});

export type Outer_Temp = RShape<typeof r>;
