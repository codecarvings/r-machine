import { OuterGear, type RShape } from "../setup";

export const r = OuterGear.withState({
  value: 0,
  id: 0,
}).define(({ $ }, _) => {
  /*
  _.action()({
    value: Math.floor(Math.random() * 100),
  });
  */
  const setRandomId = _.action(() => ({
    id: Math.floor(Math.random() * 1000),
  }));

  _.relay({
    select: () => $.state.value,
    onChange: (newValue: number) => {
      if (newValue === 1) {
        return _.cmd(setRandomId);
      }
    },
  });

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
