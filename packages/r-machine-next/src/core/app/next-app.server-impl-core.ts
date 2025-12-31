import type { ImplFactory } from "r-machine/strategy";
import type { NextAppServerImplCore, NextAppStrategyCoreConfig } from "./next-app-strategy-core.js";

export const createNextAppServerImplCore: ImplFactory<
  NextAppServerImplCore<any, string>,
  NextAppStrategyCoreConfig<any, string>
> = async (_rMachine, strategyConfig) => {
  const { localeKey } = strategyConfig;
  const autoLocaleBinding = strategyConfig.autoLocaleBinding === "on";

  return {
    localeKey,
    autoLocaleBinding,
  };
};
