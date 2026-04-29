import { OuterGear, type RShape } from "@/r-machine/setup";

export const r = OuterGear.deps("base/config").define((__, _) => {
  return { time: _.getter(() => new Date().toLocaleTimeString()) };
});

export type Vertex_Timer = RShape<typeof r>;
