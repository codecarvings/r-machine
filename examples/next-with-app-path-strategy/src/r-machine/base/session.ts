import { BaseGear, type RShape } from "../setup";

export const r = BaseGear.define(() => {
  return {
    getSession() {
      return "session";
    },
  };
});

export type Base_Session = RShape<typeof r>;
