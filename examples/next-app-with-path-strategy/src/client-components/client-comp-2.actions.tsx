"use server";

import { setLocale } from "@/r-machine/server-tools";

export async function setLocaleOnServer(newLocale: string) {
  setLocale(newLocale);
}
