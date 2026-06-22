import { NextAppPathStrategy } from "@r-machine/next/app/path";
import { createNextDevImport } from "@r-machine/next/dev";
import { RMachine, type RMachineLocale } from "r-machine";
import { PathAtlas } from "./path-atlas";
import { ResourceAtlas } from "./resource-atlas";

const devImport = await createNextDevImport(import.meta.url);

const rMachine = RMachine.create({
  locales: ["en", "it-IT"],
  defaultLocale: "en",
  ResourceAtlas,
  // `@vite-ignore` is needed for `verifyResourceAtlas` tests under vitest; Webpack/Turbopack ignore the comment.
  load: (path) => (devImport ? devImport(`./${path}`) : import(/* @vite-ignore */ `./${path}`)),
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
