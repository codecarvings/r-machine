import { type RShape, Shell } from "@/r-machine/setup";

export const r = Shell.withDeps("base/config").define(([config, $]) => {
  void config;
  return {
    greeting: `Hello ${$.kit.fmt.number(21)}`,
    farewell: "Goodbye",
  };
});

export type Shell_Common = RShape<typeof r>;
