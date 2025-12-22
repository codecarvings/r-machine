import type { AnyAtlas, RMachine } from "r-machine";
import type { CustomLocaleDetector, CustomLocaleStore } from "r-machine/strategy";
import { ReactStrategyCore } from "#r-machine/react/core";
import { createReactImpl } from "./react.impl.js";

export interface ReactStrategyConfig {
  readonly localeDetector: CustomLocaleDetector | undefined;
  readonly localeStore: CustomLocaleStore | undefined;
}
export interface PartialReactStrategyConfig {
  readonly localeDetector?: CustomLocaleDetector | undefined;
  readonly localeStore?: CustomLocaleStore | undefined;
}

const defaultConfig: ReactStrategyConfig = {
  localeDetector: undefined,
  localeStore: undefined,
};

export class ReactStrategy<A extends AnyAtlas> extends ReactStrategyCore<A, ReactStrategyConfig> {
  constructor(rMachine: RMachine<A>);
  constructor(rMachine: RMachine<A>, config: PartialReactStrategyConfig);
  constructor(rMachine: RMachine<A>, config: PartialReactStrategyConfig = {}) {
    super(
      rMachine,
      {
        ...defaultConfig,
        ...config,
      },
      createReactImpl
    );
  }
}
