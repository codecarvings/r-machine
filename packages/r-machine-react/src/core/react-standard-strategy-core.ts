import type { AnyFmtProvider, AnyResourceAtlas } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import type { CustomLocaleDetector, CustomLocaleStore } from "r-machine/strategy";
import { createReactStandardImpl } from "./react-standard.impl.js";
import { ReactStrategyCore } from "./react-strategy-core.js";

export interface ReactStandardStrategyConfig {
  readonly localeDetector: CustomLocaleDetector | undefined;
  readonly localeStore: CustomLocaleStore | undefined;
}
export interface PartialReactStandardStrategyConfig {
  readonly localeDetector?: CustomLocaleDetector | undefined;
  readonly localeStore?: CustomLocaleStore | undefined;
}

const defaultConfig: ReactStandardStrategyConfig = {
  localeDetector: undefined,
  localeStore: undefined,
};

export abstract class ReactStandardStrategyCore<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  FP extends AnyFmtProvider,
> extends ReactStrategyCore<RA, L, FP, ReactStandardStrategyConfig> {
  static readonly defaultConfig = defaultConfig;

  protected createImpl() {
    return createReactStandardImpl<RA, L, FP>(this.rMachine, this.config);
  }
}
