import { ReactStandardStrategy } from "@r-machine/react";
import { RMachine, type RMachineLocale, type RMachineRCtx } from "r-machine";
import { Formatters } from "./formatters";
import type { ResourceAtlas } from "./resource-atlas";

// Vite statically analyzes this at build time and creates chunk files for all matching modules
const moduleLoaders = import.meta.glob<{ default: any }>("./resources/**/*.{tsx,ts}");

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

const rMachineExtBuilder = rMachineBuilder.with({ Formatters });
export type R$ = RMachineRCtx<typeof rMachineExtBuilder>;

export const rMachine = rMachineExtBuilder.create<ResourceAtlas>();

export const strategy = new ReactStandardStrategy(rMachine, {
  localeDetector: () => rMachine.localeHelper.matchLocales(navigator.languages),
  localeStore: {
    get: () => localStorage.getItem("locale") ?? undefined,
    set: (newLocale) => localStorage.setItem("locale", newLocale),
  },
});
