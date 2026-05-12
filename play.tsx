import { defineLayout, RMachine, type RMachineLocale } from "r-machine";

const folders = defineLayout({
  "gear/": "gear",
  "vertex/": "gear:vertex",
  "shell/": "shell",
});

type ResourceMap = {};

class ResourceAtlas extends folders<ResourceMap>() {}

const rMachine = RMachine.create({
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  load: (path) => import(`./${path}.ts`),
});

export const { Gear, Shell, localized } = rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
