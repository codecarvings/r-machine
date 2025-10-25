import { RMachineError } from "r-machine/common";
import { type BinProviderMap, defaultBinProvider } from "r-machine/strategy";
import { type ReactImpl, type ReactImplPackage, ReactStrategy } from "#r-machine/react/core";

type ReactStandardStrategyImpl = ReactImpl<ReactStandardStrategyConfig>;
interface ReactStandardStrategyConfig {
  readonly impl: ReactStandardStrategyImpl;
}

type PartialReactStandardStrategyImpl = Partial<ReactStandardStrategyImpl>;
interface PartialReactStandardStrategyConfig {
  readonly impl?: PartialReactStandardStrategyImpl;
}

const defaultImpl: ReactStandardStrategyImpl = {
  writeLocale: () => {
    throw new RMachineError(
      "ReactStandardStrategy by default does not support writing locale and no custom implementation was provided."
    );
  },
};

const binProviders: BinProviderMap<ReactStandardStrategyImpl> = {
  writeLocale: defaultBinProvider,
};

const defaultConfig: ReactStandardStrategyConfig = {
  impl: defaultImpl,
};

export class ReactStandardStrategy extends ReactStrategy<ReactStandardStrategyConfig> {
  constructor();
  constructor(config: PartialReactStandardStrategyConfig);
  constructor(config?: PartialReactStandardStrategyConfig) {
    super({
      ...defaultConfig,
      impl: { ...defaultConfig.impl, ...config?.impl },
    });

    this.implPackage = {
      impl: this.config.impl,
      binProviders,
    };
  }

  protected readonly implPackage: ReactImplPackage<ReactStandardStrategyConfig>;
  protected getImplPackage() {
    return this.implPackage;
  }
}
