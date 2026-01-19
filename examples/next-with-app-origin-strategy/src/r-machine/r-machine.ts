import { NextAppOriginStrategy } from "@r-machine/next/app";
import { RMachine } from "r-machine";
import type { ResourceAtlas } from "./resource-atlas";

export const rMachine = new RMachine<ResourceAtlas>({
  locales: ["en", "it-IT"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
});

export const strategy = new NextAppOriginStrategy(rMachine, {
  // Origins per locale - See also next.config.ts
  localeOriginMap: {
    en: "http://english.test:3000",
    "it-IT": ["http://italiano.test:3000"],
  },
  pathMatcher: /^(?!\/non-localized($|\/)).*/,
});
