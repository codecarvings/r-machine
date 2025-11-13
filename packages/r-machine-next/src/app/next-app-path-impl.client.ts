import type { ImplFactory } from "r-machine/strategy";
import type { NextClientImpl } from "#r-machine/next/core";
import { createSetLocaleCookieForNextClientImpl } from "./cookie.client.js";
import type { NextAppPathStrategyConfig } from "./next-app-path-strategy.js";

export const nextAppPathImpl_clientFactory: ImplFactory<NextClientImpl, NextAppPathStrategyConfig<string>> = async (
  _rMachine,
  strategyConfig
) => {
  const { lowercaseLocale, basePath } = strategyConfig;

  const lowercaseLocaleSw = lowercaseLocale === "on";

  return {
    writeLocale(newLocale, router) {
      const locale = lowercaseLocaleSw ? newLocale.toLowerCase() : newLocale;
      const path = `${basePath}/${locale}`;

      router.push(path);
    },
    setLocaleCookie: createSetLocaleCookieForNextClientImpl(strategyConfig),
  };
};
