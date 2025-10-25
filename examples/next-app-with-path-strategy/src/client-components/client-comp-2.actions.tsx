"use server";

import { setLocale } from "@/r-machine/server-toolset";

export async function setLocaleOnServer(newLocale: string) {
  setLocale(newLocale);
}
