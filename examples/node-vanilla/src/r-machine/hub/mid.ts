import { HubGear, type RShape } from "../setup";

export const r = HubGear.define(() => {
  return {
    name: "mid",
  };
});

export type Hub_Mid = RShape<typeof r>;
