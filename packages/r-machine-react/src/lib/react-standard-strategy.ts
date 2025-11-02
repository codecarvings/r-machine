import type { CustomLocaleDetector, CustomLocaleStore } from "r-machine/strategy";
import { ReactStandardImplProvider } from "#r-machine/react/core";
import { reactStandardImplFactory } from "./react-standard-impl.js";

export interface ReactStandardStrategyConfig {
  readonly localeDetector: CustomLocaleDetector | undefined;
  readonly localeStore: CustomLocaleStore | undefined;
}
export type PartialReactStandardStrategyConfig = Partial<ReactStandardStrategyConfig>;

const defaultConfig: ReactStandardStrategyConfig = {
  localeDetector: undefined,
  localeStore: undefined,
};

export class ReactStandardStrategy extends ReactStandardImplProvider<ReactStandardStrategyConfig> {
  constructor(config: PartialReactStandardStrategyConfig) {
    super(
      {
        ...defaultConfig,
        ...config,
      },
      reactStandardImplFactory
    );
  }
}
