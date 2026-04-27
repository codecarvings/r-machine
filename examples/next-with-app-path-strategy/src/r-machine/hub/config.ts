import { HubGear, type RShape } from "../setup";

export const r = HubGear.define(() => {
  return {
    useFeature1: true,
  };
});

export type Hub_Config = RShape<typeof r>;
