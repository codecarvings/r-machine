import { RMachineError } from "r-machine/errors";
import { type ReactStandardImpl, ReactStandardImplProvider } from "#r-machine/react/core";

interface ReactStandardStrategyConfig {
  readonly detectLocale: (() => string) | undefined;
  readonly readLocale: (() => string | undefined) | undefined;
  readonly writeLocale: ((newLocale: string) => void) | undefined;
}
type PartialReactStandardStrategyConfig = Partial<ReactStandardStrategyConfig>;

const defaultConfig: ReactStandardStrategyConfig = {
  detectLocale: undefined,
  readLocale: undefined,
  writeLocale: undefined,
};

const impl: ReactStandardImpl<ReactStandardStrategyConfig> = {
  readLocale: (bin) => {
    if (bin.strategyConfig.readLocale) {
      const locale = bin.strategyConfig.readLocale();
      if (locale !== undefined) {
        return locale;
      }
    }

    if (bin.strategyConfig.detectLocale) {
      return bin.strategyConfig.detectLocale();
    }

    return bin.rMachine.config.defaultLocale;
  },
  writeLocale: (newLocale, bin) => {
    if (bin.strategyConfig.writeLocale) {
      bin.strategyConfig.writeLocale(newLocale);
      return;
    }

    throw new RMachineError(
      "ReactStandardStrategy by default does not support writing locale and no custom implementation was provided."
    );
  },
};

export class ReactStandardStrategy extends ReactStandardImplProvider<ReactStandardStrategyConfig> {
  constructor(config: PartialReactStandardStrategyConfig) {
    super(
      {
        ...defaultConfig,
        ...config,
      },
      impl
    );
  }
}
