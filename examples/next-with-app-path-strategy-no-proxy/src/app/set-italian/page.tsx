import { setLocale } from "@/r-machine/server-toolset";

export default async function SetItPage() {
  // Programmatically set the locale to Italian
  await setLocale("it-IT");
}
