import { BaseGear, type RShape } from "../setup";

export const r = BaseGear.define(() => {
  return {
    parseData() {
      return "session";
    },
  };
});

export type Base_JWT = RShape<typeof r>;
