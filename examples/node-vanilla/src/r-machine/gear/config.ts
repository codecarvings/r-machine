import { GearPlug, type R } from "../setup";

export const plug = GearPlug().plain();

export const r = plug.Gear(() => {
  return {
    someData: true,
  };
});

export type Gear_Config = R<typeof r>;
