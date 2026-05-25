import { OuterGear, type RShape } from "../setup";

export const r = OuterGear.withState({
  value: 0,
}).define(({ $ }, _) => {
  /*
  _.action()({
    value: Math.floor(Math.random() * 100),
  });
  */

  const $inc = _.action(() => ({
    value: $.state.value + 1,
  }));
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

export type Vertex_Timer = RShape<typeof r>;
