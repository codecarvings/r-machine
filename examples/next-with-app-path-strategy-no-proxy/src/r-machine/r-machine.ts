import { NextAppPathStrategy } from "@r-machine/next/app";
import { RMachine } from "r-machine";
import type { Atlas } from "./atlas";
import { pathAtlas } from "./path-atlas";

export const rMachine = new RMachine<Atlas>({
  locales: ["en", "it-IT"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
});

export const strategy = new NextAppPathStrategy(rMachine, {
  pathAtlas,
  cookie: "on",
});
