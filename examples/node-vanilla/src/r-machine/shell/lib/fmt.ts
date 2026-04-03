import { type R, RPlug } from "@/r-machine/setup";

export const plug = RPlug.connect();

export const r = plug.wireShell(() => {
  return {
    number: (n: number) => `The number is ${n}`,
  };
});

export type Shell_Lib_Fmt = R<typeof r>;
