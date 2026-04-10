import { Forge, type RShape } from "../setup";

export const r = Forge.gear(() => {
  return {
    someData: true,
  };
});

export type Gear_Config = RShape<typeof r>;
