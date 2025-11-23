import { setLocale } from "@/r-machine/server-toolset";

export default async function SetItPage() {
  await setLocale("it-IT");
}
