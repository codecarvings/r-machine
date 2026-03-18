import { NextAppOriginStrategy } from "@r-machine/next/app";
import { RMachine, type RMachineLocale } from "r-machine";
import { PathAtlas } from "./path-atlas";
import type { ResourceAtlas } from "./resource-atlas";

export const rMachine = RMachine.for<ResourceAtlas>().create({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
});

export type Locale = RMachineLocale<typeof rMachine>;

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
