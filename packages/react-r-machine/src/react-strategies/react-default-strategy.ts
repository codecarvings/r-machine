import { ReactStrategy } from "../react-strategy.js";
import type { ReactStrategyImpl } from "../react-strategy-impl.js";

type ReactDefaultStrategyImpl = ReactStrategyImpl<ReactDefaultStrategyConfig>;
interface ReactDefaultStrategyConfig {
  readonly impl: ReactDefaultStrategyImpl;
}

type PartialReactDefaultStrategyImpl = Partial<ReactDefaultStrategyImpl>;
interface ReactPartialDefaultStrategyConfig {
  readonly impl?: PartialReactDefaultStrategyImpl;
}

const defaultConfig: ReactDefaultStrategyConfig = {
  impl: {
    writeLocale: () => {
      throw new Error(
        "ReactDefaultStrategy by default does not support writing locale and no custom implementation was provided."
      );
    },
  },
};

export class ReactDefaultStrategy extends ReactStrategy<ReactDefaultStrategyConfig> {
  constructor();
  constructor(config: ReactPartialDefaultStrategyConfig);
  constructor(config?: ReactPartialDefaultStrategyConfig) {
    super({
      ...defaultConfig,
      impl: { ...defaultConfig.impl, ...config?.impl },
    });
  }

  protected getReactStrategyImpl(): ReactDefaultStrategyImpl {
    return this.config.impl;
  }
}
