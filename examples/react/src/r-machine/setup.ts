import { ReactStandardStrategy } from "@r-machine/react";
import { RMachine, type RMachineLocale } from "r-machine";
import type { AnyResModule } from "r-machine/core";
import { ResourceAtlas } from "./resource-atlas";

// Vite statically analyzes this at build time and creates chunk files for all matching modules
const moduleLoaders = import.meta.glob<AnyResModule>("./**/*.{tsx,ts}");

const rMachine = RMachine.create({
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  load: async (path) => {
    const modulePathTsx = `./${path}.tsx`;
    const modulePathTs = `./${path}.ts`;
    const resolvedPath = moduleLoaders[modulePathTsx]
      ? modulePathTsx
      : moduleLoaders[modulePathTs]
        ? modulePathTs
        : null;

    if (!resolvedPath) {
      throw new Error(`Module not found: ${path}`);
    }

    return moduleLoaders[resolvedPath]!();
  },
  shellKit: {
    fmt: "shell/lib/fmt",
  },
  experimental: {
    outerGear: "on",
  },
});

export const { InnerGear, BaseGear, OuterGear, Shell, localized } = rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";

export const strategy = ReactStandardStrategy.create(rMachine, {
  kit: {
    fmt: "shell/lib/fmt",
  },
  localeDetector: () => rMachine.localeHelper.matchLocales(navigator.languages),
  localeStore: {
    get: () => localStorage.getItem("locale") ?? undefined,
    set: (newLocale) => localStorage.setItem("locale", newLocale),
  },
});

export const { localeHelper } = strategy.getHelpers();
