import { ReactStandardStrategy } from "@r-machine/react";
import { ofType, RMachine, type RMachineLocale } from "r-machine";
import type { ResourceAtlas } from "./resource-atlas";

// Vite statically analyzes this at build time and creates chunk files for all matching modules
const moduleLoaders = import.meta.glob<{ r: any }>("./**/*.{tsx,ts}");

const rMachine = RMachine.create({
  resourceAtlas: ofType<ResourceAtlas>(),
  locales: ["en", "it"],
  defaultLocale: "en",
  load: (namespace, locale) => {
    // Find the appropriate module loader for either .tsx or .ts files
    const modulePathTsx = `./${namespace}/${locale}.tsx`;
    const modulePathTs = `./${namespace}/${locale}.ts`;
    const moduleLoader = moduleLoaders[modulePathTsx] || moduleLoaders[modulePathTs];

    if (!moduleLoader) {
      throw new Error(`Module not found: ${namespace}/${locale}`);
    }

    return moduleLoader();
  },
  kit: {
    fmt: "shell/lib/fmt",
  },
});

export const { RPlug, localized } = rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as R } from "r-machine";

// Step 4: setup the strategy
export const strategy = new ReactStandardStrategy(rMachine, {
  localeDetector: () => rMachine.localeHelper.matchLocales(navigator.languages),
  localeStore: {
    get: () => localStorage.getItem("locale") ?? undefined,
    set: (newLocale) => localStorage.setItem("locale", newLocale),
  },
});
