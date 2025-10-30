import type { ReactStandardImpl } from "#r-machine/react/core";
import type { ReactStandardStrategyConfig } from "./react-standard-strategy.js";

export const reactStandardImpl: ReactStandardImpl<ReactStandardStrategyConfig> = {
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
