import { notFound, redirect } from "next/navigation";
import type { NextAppRouterServerImpl } from "#r-machine/next/core/app-router";
import type { NextAppRouterStandardStrategyConfig } from "./next-app-router-standard-strategy.js";

export const nextAppRouterStandardImpl_server: NextAppRouterServerImpl<NextAppRouterStandardStrategyConfig<string>> = {
  onBindLocaleError() {
    notFound();
  },

  writeLocale(newLocale, bin) {
    const { lowercaseLocale } = bin.strategyConfig;
    const locale = lowercaseLocale ? newLocale.toLowerCase() : newLocale;
    const path = `/${locale}`;

    redirect(path);
  },
};
