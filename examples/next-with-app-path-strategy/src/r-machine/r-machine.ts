import { NextAppPathStrategy } from "@r-machine/next/app";
import { RMachine, type RMachineLocale } from "r-machine";
import { PathAtlas } from "./path-atlas";
import type { ResourceAtlas } from "./resource-atlas";

export const rMachine = RMachine.for<ResourceAtlas>().create({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
});

export type Locale = RMachineLocale<typeof rMachine>;

export const strategy = new NextAppPathStrategy(rMachine, {
  PathAtlas,
  cookie: "on",
  // implicitDefaultLocale: "on",
  implicitDefaultLocale: {
    // Exclude non-localized paths from implicit default locale handling
    pathMatcher: /^(?!\/(__|hello-world|set-italian)($|\/)).*/,
  },

  // autoLocaleBinding: "on",
  // localeLabel: "strict",
  // basePath: "/subdir",
});
