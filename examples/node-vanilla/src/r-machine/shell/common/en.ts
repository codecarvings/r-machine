import { mockPlug } from "@r-machine/testing";
import { Forge, type RShape } from "@/r-machine/setup";

export const r = Forge.connected().shell(({ fmt }) => {
  return {
    greeting: `Hello ${fmt.number(21)}`,
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
