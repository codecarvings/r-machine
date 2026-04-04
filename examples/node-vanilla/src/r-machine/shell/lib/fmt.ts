import { Gear } from "@/r-machine/setup";

export const { r, plug } = Gear().forge((plug) => {
  const { $ } = plug.use();
  return $.locale;
});

/*
export const { r, plug } = Gear().forge2(() => {
  const { _ } = plug.use();
  return _.resource({
    number: (n: number) => `The number is ${n}`,
  });
});

export type Shell_Lib_Fmt = R<typeof r>;
*/
