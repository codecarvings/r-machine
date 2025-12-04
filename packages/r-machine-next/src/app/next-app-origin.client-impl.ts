import type { ImplFactory } from "r-machine/strategy";
import type { NextClientImpl } from "#r-machine/next/core";
import { getOriginResolver, type NextAppOriginStrategyConfig } from "./next-app-origin-strategy.js";

export const createNextAppOriginClientImpl: ImplFactory<NextClientImpl, NextAppOriginStrategyConfig<string>> = async (
  rMachine,
  strategyConfig
) => {
  const resolveOriginHref = getOriginResolver(strategyConfig.localeOriginMap, rMachine);

  return {
    onLoad: undefined,

    writeLocale(newLocale, router) {
      const href = resolveOriginHref(newLocale);
      router.push(href!);
    },
  };
};
