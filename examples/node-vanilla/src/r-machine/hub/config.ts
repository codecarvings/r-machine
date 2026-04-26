import { HubGear, type RShape } from "../setup.js";

export const r = HubGear.define(() => {
  return {
    someData: true,
  };
});

export type Hub_Config = RShape<typeof r>;
