import { RMachine, type RMachineLocale } from "r-machine";
import { ResourceAtlas } from "./resource-atlas";

export const rMachine = RMachine.create({
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  load: (path) => import(`./${path}.ts`),
  bridgeGears: ["base/config"],
  gearKit: {
    config: "base/config",
  },
  shellKit: {
    fmt: "shell/lib/fmt",
    config: "base/config",
  },
  experimental: {
    outerGear: "on",
  },
});

export const { InnerGear, BaseGear, OuterGear, Shell, localized } = rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";
