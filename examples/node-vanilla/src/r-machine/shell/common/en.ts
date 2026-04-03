import { type R, RPlug } from "@/r-machine/setup";

export const plug = RPlug.connect("shell/lib/fmt");
export const r = plug.wireShell(() => {
  const [fmt] = plug.use();

  return {
    greeting: `Hello ${fmt.number(21)}`,
    farewell: "Goodbye",
  };
});

export type Shell_Common = R<typeof r>;
