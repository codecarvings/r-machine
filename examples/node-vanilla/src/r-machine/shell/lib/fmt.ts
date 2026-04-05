import { BasePlug, type R } from "@/r-machine/setup";

export const plug = BasePlug();

export const r = plug.Gear(() => {
  const { $ } = plug.use();
  return {
    locale: $.locale,
    number: (num: number) => num.toLocaleString(),
  };
});

export type Shell_Lib_Fmt = R<typeof r>;
