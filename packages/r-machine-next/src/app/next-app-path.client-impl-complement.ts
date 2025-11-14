import type { ImplFactory } from "r-machine/strategy";
import type { NextAppPersistentClientImplComplement } from "#r-machine/next/core/app";
import type { NextAppPathStrategyConfig } from "./next-app-path-strategy.js";

export const createNextAppPathClientImplComplement: ImplFactory<
  NextAppPersistentClientImplComplement,
  NextAppPathStrategyConfig<string>
> = async (_rMachine, strategyConfig) => {
  const { basePath } = strategyConfig;
  const lowercaseLocale = strategyConfig.lowercaseLocale === "on";
  // Do not consider implicitDefaultLocale since when writing locale we always write explicit locale (to set cookie)

  return {
    writeLocale(newLocale, router) {
      const locale = lowercaseLocale ? newLocale.toLowerCase() : newLocale;
      const path = `${basePath}/${locale}`;

      router.push(path);
    },
  };
};
