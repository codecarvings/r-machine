import { NextAppFlatStrategy } from "@r-machine/next/app/flat";
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
export const strategy = new NextAppFlatStrategy(rMachine, {
  PathAtlas,
  // Exclude non-localized paths
  pathMatcher: /^(?!\/(__|hello-world|set-italian)($|\/)).*/,
});
