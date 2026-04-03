import { RPlug } from "../setup";

export const plug = RPlug.reactive({
  counter: 0,
}).connect();

export const r = plug.wireGear(() => {
  const { $, _ } = plug.use();

  return {
    state: _.getter(),
    clear: _.action(() => ({ counter: 0 })),
    increment: _.action(() => ({ counter: $.state.counter + 1 })),
    double: _.getter(() => $.state.counter * 2),
    $internal: _.action(() => ({ counter: $.state.counter + 100 })),
  };
});
