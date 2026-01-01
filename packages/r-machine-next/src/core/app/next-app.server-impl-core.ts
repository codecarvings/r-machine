import type { ImplFactory } from "r-machine/strategy";
import type { NextAppServerImplCore, NextAppStrategyConfig } from "./next-app-strategy-core.js";

export const createNextAppServerImplCore: ImplFactory<
  NextAppServerImplCore<any, string>,
  NextAppStrategyConfig<any, string>
> = async (_rMachine, strategyConfig) => {
  const { localeKey } = strategyConfig;
  const autoLocaleBinding = strategyConfig.autoLocaleBinding === "on";

  return {
    localeKey,
    autoLocaleBinding,
  };
};
