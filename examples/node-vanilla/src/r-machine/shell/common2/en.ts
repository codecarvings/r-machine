import { type RShape, Shell } from "@/r-machine/setup";

export const r = Shell.define(({ fmt }) => ({
  greeting: `Hello world ${fmt.number(21)}`,
}));

export type Shell_Common2 = RShape<typeof r>;
