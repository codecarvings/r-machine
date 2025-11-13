import type { ImplFactory } from "r-machine/strategy";
import type { NextClientImpl } from "#r-machine/next/core";
import { createSetLocaleCookieForNextClientImpl } from "./cookie.client.js";
import type { NextAppPathStrategyConfig } from "./next-app-path-strategy.js";

export const nextAppPathImpl_clientFactory: ImplFactory<NextClientImpl, NextAppPathStrategyConfig<string>> = async (
  _rMachine,
  strategyConfig
) => ({
  writeLocale(newLocale, router) {
    const locale = strategyConfig.lowercaseLocale ? newLocale.toLowerCase() : newLocale;
    const path = `/${locale}`;

    router.push(path);
  },
  setLocaleCookie: createSetLocaleCookieForNextClientImpl(strategyConfig),
});
