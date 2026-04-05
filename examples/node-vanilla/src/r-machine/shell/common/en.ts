import { BasePlug, type R } from "@/r-machine/setup";

export const plug = BasePlug("shell/lib/fmt");

export const r = plug.Shell(() => {
  const [fmt] = plug.use();

  return {
    greeting: `Hello ${fmt.number(21)}`,
    farewell: "Goodbye",
  };
});

export type Shell_Common = R<typeof r>;
