import type { ImplFactory } from "r-machine/strategy";
import type { NextAppServerImplSubset, NextAppStrategyConfig } from "./next-app-strategy.js";

export const createNextAppServerImplSubset: ImplFactory<
  NextAppServerImplSubset<string>,
  NextAppStrategyConfig<string>
> = async (_rMachine, strategyConfig) => {
  const { localeKey } = strategyConfig;
  const autoLocaleBinding = strategyConfig.autoLocaleBinding === "on";

  return {
    localeKey,
    autoLocaleBinding,
  };
};
