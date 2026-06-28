import { NextAppFlatStrategy } from "@r-machine/next/app/flat";
import { RMachine, type RMachineLocale } from "r-machine";
import { PathAtlas } from "./path-atlas";
import { ResourceAtlas } from "./resource-atlas";
import "./pub/loader";

const rMachine = RMachine.create({
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  shellKit: {
    fmt: "shell/lib/fmt",
  },
  experimental: {
    outerGear: "on",
  },
});

export const { InnerGear, BaseGear, OuterGear, Shell, DirectPlug, localized } = rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";

export const strategy = NextAppFlatStrategy.create(rMachine, {
  serverKit: {
    fmt: "shell/lib/fmt",
  },
  clientKit: {
    fmt: "shell/lib/fmt",
  },
  PathAtlas,
  // Exclude non-localized paths
  pathMatcher: /^(?!\/(__|hello-world|set-italian)($|\/)).*/,
});

export const { localeHelper, hrefHelper } = strategy.getHelpers();
