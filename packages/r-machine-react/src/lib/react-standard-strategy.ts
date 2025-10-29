import type { CustomLocaleDetector, CustomLocaleStore } from "r-machine/strategy";
import { type ReactStandardImpl, ReactStandardImplProvider } from "#r-machine/react/core";

interface ReactStandardStrategyConfig {
  readonly localeDetector: CustomLocaleDetector | undefined;
  readonly localeStore: CustomLocaleStore | undefined;
}
type PartialReactStandardStrategyConfig = Partial<ReactStandardStrategyConfig>;

const defaultConfig: ReactStandardStrategyConfig = {
  localeDetector: undefined,
  localeStore: undefined,
};

const impl: ReactStandardImpl<ReactStandardStrategyConfig> = {
  readLocale: (bin) => {
    if (bin.strategyConfig.localeStore) {
      const locale = bin.strategyConfig.localeStore.get();
      if (locale !== undefined) {
        return locale;
      }
    }

    let locale: string;
    if (bin.strategyConfig.localeDetector) {
      locale = bin.strategyConfig.localeDetector();
    } else {
      locale = bin.rMachine.config.defaultLocale;
    }

    if (bin.strategyConfig.localeStore) {
      bin.strategyConfig.localeStore.set(locale);
    }

    return locale;
  },
  writeLocale: (newLocale, bin) => {
    if (bin.strategyConfig.localeStore) {
      bin.strategyConfig.localeStore.set(newLocale);
    }
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
