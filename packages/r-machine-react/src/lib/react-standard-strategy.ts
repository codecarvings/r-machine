import type { AnyAtlas, RMachine } from "r-machine";
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

export class ReactStandardStrategy<A extends AnyAtlas> extends ReactStandardImplProvider<
  A,
  ReactStandardStrategyConfig
> {
  constructor(rMachine: RMachine<A>);
  constructor(rMachine: RMachine<A>, config: PartialReactStandardStrategyConfig);
  constructor(rMachine: RMachine<A>, config: PartialReactStandardStrategyConfig = {}) {
    super(
      rMachine,
      {
        ...defaultConfig,
        ...config,
      },
      createReactStandardImpl
    );
  }
}
