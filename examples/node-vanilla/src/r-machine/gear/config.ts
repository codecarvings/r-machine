import { R, type RShape } from "../setup";

export const r = R.gear(() => {
  return {
    someData: true,
  };
});

export type Gear_Config = RShape<typeof r>;
