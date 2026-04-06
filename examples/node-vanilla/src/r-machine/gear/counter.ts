import { type R, ReactivePlug } from "../setup";

export const plug = ReactivePlug().defaultState(0);

export const r = plug.Gear(() => {
  const { $, _ } = plug.use();

  return {
    increment: _.action(() => $.state + 1),
    decrement: _.action(() => $.state - 1),
    reset: _.action(() => $.defaultState),
    myCount: _.getter(() => $.state),
  };
});

export type Gear_Counter = R<typeof r>;
