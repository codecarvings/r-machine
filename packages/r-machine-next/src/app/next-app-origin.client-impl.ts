import type { ImplFactory } from "r-machine/strategy";
import type { NextClientImpl } from "#r-machine/next/core";
import type { AnyNextAppOriginStrategyConfig } from "#r-machine/next/core/app";
import { getOriginResolver } from "./next-app-origin-strategy.js";

export const createNextAppOriginClientImpl: ImplFactory<NextClientImpl, AnyNextAppOriginStrategyConfig> = async (
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

    // TODO: Implement createUsePathComposer
    createUsePathComposer: undefined!,
  };
};
