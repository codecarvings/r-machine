import { type R, ShellPlug } from "@/r-machine/setup";

export const plug = ShellPlug("shell/lib/fmt", "gear/counter");

export const r = plug.Shell(() => {
  const [fmt, counter, $] = plug.use();
  counter.increment();

  return {
    greeting: `Hello ${fmt.number(21)}`,
    farewell: "Goodbye",
  };
});

export type Shell_Common = R<typeof r>;
