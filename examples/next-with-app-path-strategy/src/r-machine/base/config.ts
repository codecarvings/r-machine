import { BaseGear, type RShape } from "../setup";

export const r = BaseGear.define(() => {
  return {
    useFeature1: true,
  };
});

export type Base_Config = RShape<typeof r>;
