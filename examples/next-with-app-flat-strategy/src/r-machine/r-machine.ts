import { NextAppFlatStrategy } from "@r-machine/next/app";
import { RMachine } from "r-machine";
import type { ResourceAtlas } from "./resource-atlas";

export const rMachine = new RMachine<ResourceAtlas>({
  locales: ["en", "it-IT"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
});

export const strategy = new NextAppFlatStrategy(rMachine, {
  pathMatcher: /^(?!\/non-localized($|\/)).*/,
});
