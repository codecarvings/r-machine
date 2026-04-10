import { Forge, type RShape } from "@/r-machine/setup";

export const r = Forge.shell(({ $ }) => {
  return {
    locale: $.locale,
    number: (num: number) => num.toLocaleString(),
  };
});

export type Shell_Lib_Fmt = RShape<typeof r>;
