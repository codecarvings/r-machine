import { managed } from "r-machine";
import { OuterGear, type RShape } from "../setup";

export const r = OuterGear.withState(0).define(({ $ }, _) => {
  const inc = _.action(() => $.state + 1);
  const clear = setInterval(() => {
    inc();
  }, 1000);

  return managed(
    {
      value: _.getter(),
      plus: _.action((n: number) => $.state + n),
    },
    () => {
      clearInterval(clear);
    }
  );
});

export type Outer_Timer = RShape<typeof r>;
