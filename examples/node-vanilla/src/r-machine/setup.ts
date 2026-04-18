import { RMachine, type RMachineLocale } from "r-machine";
import { ResourceAtlas } from "./resource-atlas";

const rMachine = RMachine.create({
  resourceAtlas: ResourceAtlas,
  locales: ["en", "it"],
  defaultLocale: "en",
  load: (path) => import(`./${path}.ts`),
  shellKit: {
    fmt: "shell/lib/fmt",
  },
  gateKit: {
    fmt: "shell/lib/fmt",
  },
  bridgeGears: ["gear/counter"],
});

export const { Gear, VertexGear, Shell, localized } = rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";
