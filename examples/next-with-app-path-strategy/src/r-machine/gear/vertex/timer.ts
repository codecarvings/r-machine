import { Gear, type RShape } from "@/r-machine/setup";

export const r = Gear.define(() => {
  return { time: new Date().toLocaleTimeString() };
});

export type Vertex_Timer = RShape<typeof r>;
