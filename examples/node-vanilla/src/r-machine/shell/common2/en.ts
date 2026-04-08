import { type R, Shell } from "@/r-machine/setup";

export const { r, plug } = Shell(({ fmt }) => ({
  greeting: `Hello world ${fmt}`,
}));

export type Shell_Common2 = R<typeof r>;
