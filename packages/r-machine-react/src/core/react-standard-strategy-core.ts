import type { AnyAtlas } from "r-machine";
import type { CustomLocaleDetector, CustomLocaleStore } from "r-machine/strategy";
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

export abstract class ReactStandardStrategyCore<A extends AnyAtlas> extends ReactStrategyCore<
  A,
  ReactStandardStrategyConfig
> {
  static readonly defaultConfig = defaultConfig;
}
