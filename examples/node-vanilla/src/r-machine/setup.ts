import { RMachine, type RMachineLocale } from "r-machine";
import { ResourceAtlas } from "./resource-atlas";

export const rMachine = RMachine.create({
  ResourceAtlas,
  locales: ["en", "it"],
  defaultLocale: "en",
  load: (path) => import(`./${path}.ts`),
  bridgeGears: ["hub/config"],
  shellKit: {
    fmt: "shell/lib/fmt",
    config: "hub/config",
  },
  clientGateKit: {
    fmt: "shell/common2",
  },
  serverGateKit: {
    fmt: "shell/common2",
  },
  experimental: {
    outerGear: "on",
  },
});

export const { InnerGear, HubGear, OuterGear, Shell, localized } = rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";
