import { InnerGear, type RShape } from "../setup";

export const r = InnerGear.define(() => {
  return {
    name: "db",
  };
});

export type Inner_Db = RShape<typeof r>;
