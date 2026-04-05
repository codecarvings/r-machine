import { BasePlug, Gear, type R } from "@/r-machine/setup";

export const plug = BasePlug();

export const r = Gear(() => {
  const { $ } = plug.use();
  return {
    locale: $.locale,
  };
});

export type Shell_Lib_Fmt = R<typeof r>;
