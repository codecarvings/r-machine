import { BaseGear, type RShape } from "@/r-machine/setup";

export const r = BaseGear.define(() => {
  return {
    timer: 0,
    someComplexVale: {
      nested: {
        value: "hello",
      },
      anotherNested: {
        value: "world",
        array: [1, 2, 3],
      },
      value: 42,
    },
  };
});

export type Base_Timer = RShape<typeof r>;
