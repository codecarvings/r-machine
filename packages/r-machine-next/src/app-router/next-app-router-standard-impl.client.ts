import type { ImplFactory } from "r-machine/strategy";
import type { NextClientImpl } from "#r-machine/next/core";
import type { NextAppRouterStandardStrategyConfig } from "./next-app-router-standard-strategy.js";

export const nextAppRouterStandardImpl_clientFactory: ImplFactory<
  NextClientImpl,
  NextAppRouterStandardStrategyConfig<string>
> = (_rMachine, strategyConfig) => ({
  writeLocale(newLocale, router) {
    const locale = strategyConfig.lowercaseLocale ? newLocale.toLowerCase() : newLocale;
    const path = `/${locale}`;

    router.push(path);
  },
});
