import { ReactStandardStrategy } from "@r-machine/react";
import { RMachine, type RMachineLocale, type RMachineRCtx } from "r-machine";
import { fmt } from "./formatters";
import type { ResourceAtlas } from "./resource-atlas";

// Vite statically analyzes this at build time and creates chunk files for all matching modules
const moduleLoaders = import.meta.glob<{ default: any }>("./resources/**/*.{tsx,ts}");

// Step 1: config → Locale
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

// Step 2: Formatters → RCtx
const rMachineSetup = rMachineBuilder.with({ Formatters: fmt });
export type R$ = RMachineRCtx<typeof rMachineSetup>;

// Step 3: ResourceAtlas → RMachine
export const rMachine = rMachineSetup.create<ResourceAtlas>();

export const strategy = new ReactStandardStrategy(rMachine, {
  localeDetector: () => rMachine.localeHelper.matchLocales(navigator.languages),
  localeStore: {
    get: () => localStorage.getItem("locale") ?? undefined,
    set: (newLocale) => localStorage.setItem("locale", newLocale),
  },
});
