import { RMachineError } from "r-machine/errors";
import type { ImplFactory } from "r-machine/strategy";
import type { ReactStandardImpl } from "#r-machine/react/core";
import type { ReactStandardStrategyConfig } from "./react-standard-strategy.js";

export const reactStandardImplFactory: ImplFactory<ReactStandardImpl, ReactStandardStrategyConfig> = async (
  rMachine,
  strategyConfig
) => ({
  readLocale: () => {
    // If locale is stored, return it
    if (strategyConfig.localeStore) {
      const locale = strategyConfig.localeStore.get();
      if (locale !== undefined) {
        // Validation for returned locale is performed by the caller
        return locale;
      }
    }

    // Detect locale
    let locale: string;
    if (strategyConfig.localeDetector) {
      locale = strategyConfig.localeDetector();
      const error = rMachine.localeHelper.validateLocale(locale);
      if (error) {
        throw new RMachineError(`Invalid locale detected: ${locale}.`, error);
      }
    } else {
      locale = rMachine.config.defaultLocale;
    }

    // Store detected locale
    if (strategyConfig.localeStore) {
      strategyConfig.localeStore.set(locale);
    }

    return locale;
  },

  writeLocale: (newLocale) => {
    if (strategyConfig.localeStore) {
      strategyConfig.localeStore.set(newLocale);
    }
  },
});
