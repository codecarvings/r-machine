import type { ImplFactory } from "r-machine/strategy";
import type { NextClientImpl } from "#r-machine/next/core";
import type { NextAppPathStrategyConfig } from "./next-app-path-strategy.js";
import { createSetLocaleCookieForImpl } from "./next-app-with-cookie-impl.client.js";

export const nextAppPathImpl_clientFactory: ImplFactory<NextClientImpl, NextAppPathStrategyConfig<string>> = async (
  _rMachine,
  strategyConfig
) => ({
  writeLocale(newLocale, router) {
    const locale = strategyConfig.lowercaseLocale ? newLocale.toLowerCase() : newLocale;
    const path = `/${locale}`;

    router.push(path);
  },
  setLocaleCookie: createSetLocaleCookieForImpl(strategyConfig),
});
