import { OuterGear, type RShape } from "@/r-machine/setup";

export const r = OuterGear.withState({}).define(($, _) => {
  return {
    timer: _.getter(() => 0),
  };
});

export type Vertex_Timer = RShape<typeof r>;
