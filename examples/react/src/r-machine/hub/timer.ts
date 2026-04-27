import { HubGear, type RShape } from "@/r-machine/setup";

export const r = HubGear.define(() => {
  return {
    timer: 0,
  };
});

export type Hub_Timer = RShape<typeof r>;
