import { redirect } from "next/navigation";
import type { ImplFactory } from "r-machine/strategy";
import type { NextAppServerImpl } from "#r-machine/next/core/app";
import type { NextAppPathStrategyConfig } from "./next-app-path-strategy.js";

export const nextAppPathImpl_serverFactory: ImplFactory<NextAppServerImpl, NextAppPathStrategyConfig<string>> = (
  _rMachine,
  strategyConfig
) => ({
  writeLocale(newLocale) {
    const locale = strategyConfig.lowercaseLocale ? newLocale.toLowerCase() : newLocale;
    const path = `/${locale}`;

    redirect(path);
  },
});
