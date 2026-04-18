import { mockPlug } from "@r-machine/testing";
import { type RShape, Shell } from "@/r-machine/setup";

export const r = Shell.deps("gear/config").define(([config, $]) => {
  void config;
  return {
    greeting: `Hello ${$.kit.fmt.number(21)}`,
    farewell: "Goodbye",
  };
});

export type Shell_Common = RShape<typeof r>;

mockPlug(r.plug).with({
  $: {
    kit: {
      fmt: {
        number: (n) => `**${n}**`,
      },
    },
  },
});
