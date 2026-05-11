import { setLocale } from "@/r-machine/server-toolset";

// When visiting this route, the locale will be set to Italian
export async function GET() {
  await setLocale("it-IT");
}
