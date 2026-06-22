import { DirectPlug, type Locale } from "./r-machine/setup.ts";

const plug = DirectPlug("shell/greeting", "base/config");
export async function render(locale: Locale): Promise<string> {
  const [greeting, config, $] = await plug.useR(locale);

  return [
    `[${$.locale}] ${greeting.greet("Sergio")}  | app: ${config.appName}`,
    `        ${$.kit.fmt.currency(12345.6)} | ${$.kit.fmt.date.long(new Date("2026-06-25"))}`,
  ].join("\n");
}
render.plug = plug;
