import { Gear, type RShape } from "@/r-machine/setup";

export const r = Gear.define(() => {
  return {
    timer: 0,
  };
});

export type Vertex_Timer = RShape<typeof r>;
