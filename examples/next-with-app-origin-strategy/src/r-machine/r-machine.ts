import { NextAppOriginStrategy } from "@r-machine/next/app";
import { RMachine } from "r-machine";
import type { Atlas } from "./atlas";

export const rMachine = new RMachine<Atlas>({
  locales: ["en", "it-IT"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
});

export const strategy = new NextAppOriginStrategy({
  localeOriginMap: {
    en: "http://english.local:3000",
    "it-IT": ["http://italiano.local:3000"],
  },
  pathMatcher: /^(?!\/non-localized($|\/)).*/,
});
