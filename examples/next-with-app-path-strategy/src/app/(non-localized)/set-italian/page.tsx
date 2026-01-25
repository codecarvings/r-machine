import { setLocale } from "@/r-machine/server-toolset";

export default async function SetItalianPage() {
  // When visiting this page, the locale will be set to Italian
  await setLocale("it-IT");
}
