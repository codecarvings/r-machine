import { GearPlug } from "../setup";

export const plug = GearPlug();

export const r = plug.Gear(() => {
  return {
    someData: true,
  };
});
