import { ofType, RMachine, type RMachineLocale } from "r-machine";
import type { ResourceAtlas } from "./resource-atlas";

const rMachine = RMachine.create({
  resourceAtlas: ofType<ResourceAtlas>(),
  locales: ["en", "it"],
  defaultLocale: "en",
  load: (namespace, locale) => import(`./${namespace}/${locale}.ts`),
  shellKit: {
    fmt: "shell/lib/fmt",
  },
  gateKit: {
    fmt: "shell/lib/fmt",
  },
});

export const { GearPlug, ShellPlug, Shell, localized } = rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as R } from "r-machine";
