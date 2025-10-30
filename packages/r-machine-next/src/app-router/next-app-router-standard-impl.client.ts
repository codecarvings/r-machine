import type { NextClientImpl } from "#r-machine/next/core";
import type { NextAppRouterStandardStrategyConfig } from "./next-app-router-standard-strategy.js";

export const nextAppRouterStandardImpl_client: NextClientImpl<NextAppRouterStandardStrategyConfig<string>> = {
  writeLocale(newLocale, bin) {
    const { basePath, lowercaseLocale } = bin.strategyConfig;
    const locale = lowercaseLocale ? newLocale.toLowerCase() : newLocale;
    const path = `${basePath}/${locale}`;

    bin.router.push(path);
  },
};
