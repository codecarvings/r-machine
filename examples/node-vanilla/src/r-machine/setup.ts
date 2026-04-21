import { RMachine, type RMachineLocale } from "r-machine";
import { ResourceAtlas } from "./resource-atlas";

export const rMachine = RMachine.create({
  ResourceAtlas,
  locales: ["en", "it"],
  defaultLocale: "en",
  load: (path) => import(`./${path}.ts`),
  bridgeGears: ["gear/config"],
  shellKit: {
    fmt: "shell/lib/fmt",
    config: "gear/config",
  },
  gateKit: {
    fmt: "shell/common2",
  },
});

export const { Gear, Shell, localized } = rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";
