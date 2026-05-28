import { BaseGear, type RShape } from "../setup";

export const r = BaseGear.define(() => ({
  appName: "Test App",
}));

export type Base_Config = RShape<typeof r>;
