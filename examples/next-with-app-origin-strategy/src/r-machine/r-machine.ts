import { NextAppOriginStrategy } from "@r-machine/next/app";
import { RMachine } from "r-machine";
import { PathAtlas } from "./path-atlas";
import type { ResourceAtlas } from "./resource-atlas";

const locales = ["en", "it"] as const;
export type Locale = (typeof locales)[number];

export const rMachine = new RMachine<ResourceAtlas>({
  locales,
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
});

export const strategy = new NextAppOriginStrategy(rMachine, {
  PathAtlas,
  // Origins per locale - See also next.config.ts
  localeOriginMap: {
    en: "http://english.test:3000",
    it: ["http://italiano.test:3000"],
  },
  // Exclude non-localized paths
  pathMatcher: /^(?!\/(__|hello-world|set-italian)($|\/)).*/,
});
