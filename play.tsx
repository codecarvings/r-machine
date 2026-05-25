import { defineLayout, RMachine, type RMachineLocale } from "r-machine";

const folders = defineLayout({
  "base/": "gear:base",
  "shell/": "shell",
});

type ResourceMap = {};

class ResourceAtlas extends folders<ResourceMap>() {}

const rMachine = RMachine.create({
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  load: async () => undefined!, // Implement your resource loading logic here
});

export const { BaseGear, InnerGear, Shell, localized } = rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
