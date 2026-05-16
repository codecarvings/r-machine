import { ReactStandardStrategy } from "@r-machine/react";
import { RMachine, type RMachineLocale } from "r-machine";
import type { AnyResModule } from "r-machine/core";
import { ResourceAtlas } from "./resource-atlas";

// Vite statically analyzes this at build time and creates chunk files for all matching modules
const moduleLoaders = import.meta.glob<AnyResModule>("./**/*.{tsx,ts}", {});

// HMR handling: listen for custom "r-machine:update" events and trigger module reloads
const modulesToReload = new Set<string>();
if (import.meta.hot) {
  import.meta.hot.on("r-machine:update", async ({ file, changeType }) => {
    console.log(`[HMR] ${changeType} detected in ${file}`);
    modulesToReload.add(file);
    rMachine.reloadModule(file);
  });
}

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

    // If this module is marked for reload, import it with a cache-busting query parameter
    if (import.meta.hot && modulesToReload.has(path)) {
      modulesToReload.delete(path);
      const freshUrl = new URL(`${resolvedPath}?t=${Date.now()}`, import.meta.url).href;
      return import(/* @vite-ignore */ freshUrl) as Promise<AnyResModule>;
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
