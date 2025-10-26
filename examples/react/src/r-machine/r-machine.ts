import { ReactStandardStrategy } from "@r-machine/react";
import { RMachine } from "r-machine";
import type { Atlas } from "./atlas";

export const rMachine = new RMachine<Atlas>({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: async (namespace, locale) => import(/* @vite-ignore */ `./resources/${namespace}/${locale}`),
});

export const strategy = new ReactStandardStrategy();
