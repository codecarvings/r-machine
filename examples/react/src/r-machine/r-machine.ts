import { ReactStandardStrategy } from "@r-machine/react";
import { RMachine } from "r-machine";
import type { Atlas } from "./atlas";

// Vite statically analyzes this at build time and creates chunk files for all matching modules
const moduleLoaders = import.meta.glob<{ default: any }>("./resources/**/*.{tsx,ts}");

export const rMachine = new RMachine<Atlas>({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => {
    const modulePathTsx = `./resources/${namespace}/${locale}.tsx`;
    const modulePathTs = `./resources/${namespace}/${locale}.ts`;

    const moduleLoader = moduleLoaders[modulePathTsx] || moduleLoaders[modulePathTs];

    if (!moduleLoader) {
      throw new Error(`Module not found: ${namespace}/${locale}`);
    }

    return moduleLoader();
  },
});

export const strategy = new ReactStandardStrategy({
  localeDetector: () => rMachine.localeHelper.matchLocales(navigator.languages),
  localeStore: {
    get: () => localStorage.getItem("locale") ?? undefined,
    set: (newLocale) => localStorage.setItem("locale", newLocale),
  },
});
