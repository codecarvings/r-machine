import { ReactStrategy } from "../react-strategy.js";
import type { ReactStrategyImpl } from "../react-strategy-impl.js";

interface ReactDefaultStrategyConfig {
  readonly implFactory: ReactStrategyImplFactory;
}

type ReactStrategyImplFactory = () => ReactStrategyImpl;

interface ReactPartialDefaultStrategyConfig {
  readonly impl?: PartialReactStrategyImpl | ReactDefaultStrategyImplFactory;
}

type PartialReactStrategyImpl = Partial<ReactStrategyImpl>;
type ReactDefaultStrategyImplFactory = () => PartialReactStrategyImpl;

const defaultConfig: ReactDefaultStrategyConfig = {
  implFactory: () => ({
    writeLocale: () => {
      throw new Error(
        "ReactDefaultStrategy by default does not support writing locale and no custom implementation was provided."
      );
    },
  }),
};

export class ReactDefaultStrategy extends ReactStrategy {
  constructor();
  constructor(config: ReactPartialDefaultStrategyConfig);
  constructor(config?: ReactPartialDefaultStrategyConfig) {
    super();
    function implFactory(): ReactStrategyImpl {
      const partialImpl = config?.impl ? (typeof config.impl === "function" ? config.impl() : config.impl) : {};
      return { ...defaultConfig.implFactory(), ...partialImpl };
    }
    this.config = { ...defaultConfig, implFactory };
  }

  protected readonly config: ReactDefaultStrategyConfig;

  protected buildReactStrategyImpl(): ReactStrategyImpl {
    return this.config.implFactory();
  }
}
