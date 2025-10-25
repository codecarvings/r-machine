import { RMachineError } from "r-machine/common";
import { defaultBinProvider } from "r-machine/strategy";
import type { ReactImpl, ReactImplPackage } from "../core/react-impl.js";
import { ReactStrategy } from "../core/react-strategy.js";

type ReactDefaultStrategyImpl = ReactImpl<ReactDefaultStrategyConfig>;
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
      throw new RMachineError(
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

    this.implPackage = {
      impl: this.config.impl,
      binProviders: {
        writeLocale: defaultBinProvider,
      },
    };
  }

  protected readonly implPackage: ReactImplPackage<ReactDefaultStrategyConfig>;
  protected getImplPackage() {
    return this.implPackage;
  }
}
