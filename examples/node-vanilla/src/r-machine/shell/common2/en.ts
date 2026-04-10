import { Forge, type RShape } from "@/r-machine/setup";

export const r = Forge.shell(({ fmt }) => ({
  greeting: `Hello world ${fmt.number(21)}`,
}));

export type Shell_Common2 = RShape<typeof r>;
