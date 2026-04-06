import { type R, ShellPlug } from "@/r-machine/setup";

export const plug = ShellPlug();

export const r = plug.Shell(() => {
  const { $ } = plug.use();
  return {
    locale: $.locale,
    number: (num: number) => num.toLocaleString(),
  };
});

export type Shell_Lib_Fmt = R<typeof r>;
