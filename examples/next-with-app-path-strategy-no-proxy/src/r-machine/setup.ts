import { NextAppPathStrategy } from "@r-machine/next/app/path";
import { RMachine, type RMachineLocale } from "r-machine";
import { PathAtlas } from "./path-atlas";
import { ResourceAtlas } from "./resource-atlas";

const rMachine = RMachine.create({
  locales: ["en", "it-IT"],
  defaultLocale: "en",
  ResourceAtlas,
  load: (path) => import(`./${path}`),
  shellKit: {
    fmt: "shell/lib/fmt",
  },
  experimental: {
    outerGear: "on",
  },
});

export const { InnerGear, BaseGear, OuterGear, Shell, localized } = rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";

export const strategy = NextAppPathStrategy.create(rMachine, {
  serverKit: {
    fmt: "shell/lib/fmt",
  },
  clientKit: {
    fmt: "shell/lib/fmt",
  },
  PathAtlas,
  autoDetectLocale: "off",
  cookie: "on",
});

export const { localeHelper, hrefHelper } = strategy.getHelpers();
