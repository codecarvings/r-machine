import { ServerPlug } from "@/r-machine/server-toolset";

// When visiting this route, the locale will be set to Italian
export const plug = ServerPlug();
export async function GET() {
  const { $ } = await plug.use();
  await $.setLocale("it");
}
