import { type R, Shell } from "@/r-machine/setup";

export const { r, plug } = Shell(({ fmt }) => ({
  greeting: `Hello world ${fmt}`,
}));

export type Shell_Common = R<typeof r>;
