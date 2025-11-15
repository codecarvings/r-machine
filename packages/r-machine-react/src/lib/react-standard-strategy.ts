import type { CustomLocaleDetector, CustomLocaleStore } from "r-machine/strategy";
import { ReactStandardImplProvider } from "#r-machine/react/core";
import { createReactStandardImpl } from "./react-standard.impl.js";

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

export class ReactStandardStrategy extends ReactStandardImplProvider<ReactStandardStrategyConfig> {
  constructor();
  constructor(config: PartialReactStandardStrategyConfig);
  constructor(config: PartialReactStandardStrategyConfig = {}) {
    super(
      {
        ...defaultConfig,
        ...config,
      },
      createReactStandardImpl
    );
  }
}
