import { ReactStandardStrategy } from "@r-machine/react";
import { ofType, RMachine, type RMachineLocale } from "r-machine";
import type { ResourceAtlas } from "./resource-atlas";

// Vite statically analyzes this at build time and creates chunk files for all matching modules
const moduleLoaders = import.meta.glob<{ r: any }>("./**/*.{tsx,ts}");

const rMachine = RMachine.create({
  resourceAtlas: ofType<ResourceAtlas>(),
  locales: ["en", "it"],
  defaultLocale: "en",
  load: (path) => {
    // Find the appropriate module loader for either .tsx or .ts files
    const modulePathTsx = `./${path}.tsx`;
    const modulePathTs = `./${path}.ts`;
    const moduleLoader = moduleLoaders[modulePathTsx] || moduleLoaders[modulePathTs];

    if (!moduleLoader) {
      throw new Error(`Module not found: ${path}`);
    }

    return moduleLoader();
  },
  layout: {
    gear: "gear",
    shell: "shell",
    "shell/lib": "dynamic-shell",
  },
  shellKit: {
    fmt: "shell/lib/fmt",
  },
  gateKit: {
    fmt: "shell/lib/fmt",
  },
});

export const { Forge, localized } = rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";

export const strategy = new ReactStandardStrategy(rMachine, {
  localeDetector: () => rMachine.localeHelper.matchLocales(navigator.languages),
  localeStore: {
    get: () => localStorage.getItem("locale") ?? undefined,
    set: (newLocale) => localStorage.setItem("locale", newLocale),
  },
});
