import { BaseGear, type RShape } from "../setup";

export const r = BaseGear.withDeps("#base/jwt").define(([jwt]) => {
  return {
    getSession() {
      return "session";
    },
  };
});

export type Base_Session = RShape<typeof r>;
