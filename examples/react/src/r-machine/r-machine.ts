import { ReactStandardStrategy } from "@r-machine/react";
import { RMachine, type RMachineLocale, type RMachineRCtx } from "r-machine";
import { Formatters } from "./formatters";
import type { ResourceAtlas } from "./resource-atlas";

// Vite statically analyzes this at build time and creates chunk files for all matching modules
const moduleLoaders = import.meta.glob<{ default: any }>("./resources/**/*.{tsx,ts}");

// Step 1: create a r-machine builder with config (locales, defaultLocale, rModuleResolver);
//         export the inferred Locale type for use in the rest of the app
const rMachineBuilder = RMachine.builder({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => {
    // Find the appropriate module loader for either .tsx or .ts files
    const modulePathTsx = `./resources/${namespace}/${locale}.tsx`;
    const modulePathTs = `./resources/${namespace}/${locale}.ts`;
    const moduleLoader = moduleLoaders[modulePathTsx] || moduleLoaders[modulePathTs];

    if (!moduleLoader) {
      throw new Error(`Module not found: ${namespace}/${locale}`);
    }

    return moduleLoader();
  },
});
export type Locale = RMachineLocale<typeof rMachineBuilder>;

// Step 2: extend the builder with custom formatters;
//         export the inferred R$ type (context for the factories in the resource modules)
const rMachineExtBuilder = rMachineBuilder.with({ Formatters });
export type R$ = RMachineRCtx<typeof rMachineExtBuilder>;

// Step 3: create the r-machine instance mapped to the ResourceAtlas type (the shape of the resources returned by the modules)
export const rMachine = rMachineExtBuilder.create<ResourceAtlas>();

// Step 4: setup the strategy
export const strategy = new ReactStandardStrategy(rMachine, {
  localeDetector: () => rMachine.localeHelper.matchLocales(navigator.languages),
  localeStore: {
    get: () => localStorage.getItem("locale") ?? undefined,
    set: (newLocale) => localStorage.setItem("locale", newLocale),
  },
});
