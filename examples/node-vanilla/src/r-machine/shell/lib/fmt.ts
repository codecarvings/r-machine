import { R, type RShape } from "@/r-machine/setup";

export const r = R.shell(({ $ }) => {
  return {
    locale: $.locale,
    number: (num: number) => num.toLocaleString(),
  };
});

export type Shell_Lib_Fmt = RShape<typeof r>;
