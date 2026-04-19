import { Gear, type RShape } from "../setup";

export const r = Gear.define(() => {
  return {
    useFeature1: true,
  };
});

export type Gear_Config = RShape<typeof r>;
