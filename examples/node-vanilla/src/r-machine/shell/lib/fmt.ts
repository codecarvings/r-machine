import { type RShape, Shell } from "@/r-machine/setup";

export const r = Shell.define(({ $ }) => {
  return {
    locale: $.locale,
    number: (num: number) => num.toLocaleString(),
  };
});

export type Shell_Lib_Fmt = RShape<typeof r>;
