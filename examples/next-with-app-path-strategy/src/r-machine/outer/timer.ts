import { managed } from "r-machine";
import { OuterGear, type RShape } from "../setup";

export const r = OuterGear.withDeps("base/session")
  .withState(0)
  .define(([session, $], _) => {
    const inc = _.action(() => $.state + 1);
    const clear = setInterval(() => {
      inc();
    }, 1000);

    const marker = "3";

    return managed(
      {
        value: _.getter(),
        valueWithSession: _.getter(() => {
          return `${session.getSession()} - ${marker} - ${$.state}`;
        }),
      },
      () => {
        clearInterval(clear);
      }
    );
  });

export type Outer_Timer = RShape<typeof r>;
