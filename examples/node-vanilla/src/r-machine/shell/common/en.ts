import { R, type RShape } from "@/r-machine/setup";

export const r = R.shell(({ fmt }) => {
  return {
    greeting: `Hello ${fmt.number(21)}`,
    farewell: "Goodbye",
  };
});

export type Shell_Common = RShape<typeof r>;
