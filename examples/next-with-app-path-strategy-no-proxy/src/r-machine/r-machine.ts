import { NextAppPathStrategy } from "@r-machine/next/app";
import { RMachine } from "r-machine";
import { pathAtlas } from "./path-atlas";
import type { ResourcesAtlas } from "./resources-atlas";

export const rMachine = new RMachine<ResourcesAtlas>({
  locales: ["en", "it-IT"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
});

export const strategy = new NextAppPathStrategy(rMachine, {
  pathAtlas,
  cookie: "on",
});
