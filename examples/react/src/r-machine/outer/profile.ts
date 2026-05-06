import { OuterGear, type RShape } from "../setup";

export const r = OuterGear.define((_plugin, _) => {
  return {
    age: _.getter(() => 0),
  };
});

export type Outer_Profile = RShape<typeof r>;
