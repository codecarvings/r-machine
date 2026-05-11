import { NextAppOriginStrategy } from "@r-machine/next/app/origin";
import { ofType, RMachine, type RMachineLocale } from "r-machine";
import { PathAtlas } from "./path-atlas";
import type { ResourceAtlas } from "./resource-atlas";

export const { rMachine, R } = RMachine.create({
  resourceAtlas: ofType<ResourceAtlas>(),
  locales: ["en", "it"],
  defaultLocale: "en",
  load: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
  kit: {
    landingPage: "landing-page", // TODO: WIP
  },
});

export type Locale = RMachineLocale<typeof rMachine>;

// Step 4: setup the strategy
export const strategy = new NextAppOriginStrategy(rMachine, {
  PathAtlas,
  // Origins per locale - See also next.config.ts
  localeOriginMap: {
    en: "http://english.test:3000",
    it: ["http://italiano.test:3000"],
  },
  // Exclude non-localized paths
  pathMatcher: /^(?!\/(__|hello-world)($|\/)).*/,
});
