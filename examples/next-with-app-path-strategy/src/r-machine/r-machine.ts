import { NextAppPathStrategy } from "@r-machine/next/app";
import { RMachine } from "r-machine";
import type { ResourceAtlas } from "./resource-atlas";

export const rMachine = new RMachine<ResourceAtlas>({
  locales: ["en", "it-IT"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
});

export const strategy = new NextAppPathStrategy(rMachine, {
  cookie: "on",
  // implicitDefaultLocale: "on",
  implicitDefaultLocale: {
    pathMatcher: /^(?!\/non-localized($|\/)).*/,
  },

  // autoLocaleBinding: "on",
  // localeLabel: "strict",
  // basePath: "/subdir",
});
