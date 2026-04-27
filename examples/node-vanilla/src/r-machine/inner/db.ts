import { InnerGear, type RShape } from "../setup";

export const db = InnerGear.define(() => {
  return {
    name: "db",
  };
});

export type Inner_Db = RShape<typeof db>;
