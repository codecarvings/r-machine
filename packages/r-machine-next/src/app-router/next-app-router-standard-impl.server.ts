import { redirect } from "next/navigation";
import type { ImplFactory } from "r-machine/strategy";
import type { NextAppRouterServerImpl } from "#r-machine/next/core/app-router";
import type { NextAppRouterStandardStrategyConfig } from "./next-app-router-standard-strategy.js";

export const nextAppRouterStandardImpl_serverFactory: ImplFactory<
  NextAppRouterServerImpl,
  NextAppRouterStandardStrategyConfig<string>
> = (_rMachine, strategyConfig) => ({
  writeLocale(newLocale) {
    const locale = strategyConfig.lowercaseLocale ? newLocale.toLowerCase() : newLocale;
    const path = `/${locale}`;

    redirect(path);
  },
});
