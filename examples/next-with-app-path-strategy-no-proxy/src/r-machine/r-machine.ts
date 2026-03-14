import { NextAppPathStrategy } from "@r-machine/next/app";
import { RMachine } from "r-machine";
import { PathAtlas } from "./path-atlas";
import type { ResourceAtlas } from "./resource-atlas";

const locales = ["en", "it-IT"] as const;
export type Locale = (typeof locales)[number];

export const rMachine = new RMachine<ResourceAtlas>({
  locales,
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
});

export const strategy = new NextAppPathStrategy(rMachine, {
  PathAtlas,
  autoDetectLocale: "off",
  cookie: "on",
});
