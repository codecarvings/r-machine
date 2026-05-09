import { ReactStandardStrategy } from "@r-machine/react";
import { RMachine, type RMachineLocale } from "r-machine";
import type { AnyResModule } from "r-machine/core";
import { ResourceAtlas } from "./resource-atlas";

// Vite statically analyzes this at build time and creates chunk files for all matching modules
const moduleLoaders = import.meta.glob<AnyResModule>("./**/*.{tsx,ts}");

// For HMR, we need to keep track of the paths and their corresponding onUpdate callbacks
const onUpdateByPath = new Map<string, () => void>();
if (import.meta.hot) {
  const paths = Object.keys(moduleLoaders);
  import.meta.hot.accept(paths, (updated) => {
    updated?.forEach((mod, i) => {
      if (mod) {
        onUpdateByPath.get(paths[i])?.();
      }
    });
  });
}

const rMachine = RMachine.create({
  ResourceAtlas,
  locales: ["en", "it"],
  defaultLocale: "en",
  load: (path, options) => {
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

    if (import.meta.hot) {
      onUpdateByPath.set(resolvedPath, options.onUpdate);
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
