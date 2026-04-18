import { Gear, type RShape } from "../setup";

export const r = Gear.define(({ prova }) => {
  return {
    someData: true,
  };
});

export type Gear_Config = RShape<typeof r>;
