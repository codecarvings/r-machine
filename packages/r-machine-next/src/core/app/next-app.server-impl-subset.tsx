import type { ImplFactory } from "r-machine/strategy";
import type { NextAppBaseStrategyConfig, NextAppServerImplSubset } from "./next-app-base-strategy.js";

export const createNextAppServerImplSubset: ImplFactory<
  NextAppServerImplSubset<string>,
  NextAppBaseStrategyConfig<string>
> = async (_rMachine, strategyConfig) => {
  const { localeKey } = strategyConfig;
  const autoLocaleBinding = strategyConfig.autoLocaleBinding === "on";

  return {
    localeKey,
    autoLocaleBinding,
  };
};
