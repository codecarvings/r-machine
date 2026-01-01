import { RMachineError } from "r-machine/errors";
import type { ImplFactory } from "r-machine/strategy";
import type { ReactImpl, ReactStandardStrategyConfig } from "#r-machine/react/core";

export const createReactStandardImpl: ImplFactory<ReactImpl, ReactStandardStrategyConfig> = async (
  rMachine,
  strategyConfig
) => {
  function returnValidLocale(locale: string): string {
    const error = rMachine.localeHelper.validateLocale(locale);
    if (error) {
      throw new RMachineError(`Invalid locale detected: ${locale}.`, error);
    }

    return locale;
  }

  function detectLocale(): string | Promise<string> {
    if (strategyConfig.localeDetector !== undefined) {
      const localeOrPromise = strategyConfig.localeDetector();
      if (localeOrPromise instanceof Promise) {
        return localeOrPromise.then(returnValidLocale);
      } else {
        return returnValidLocale(localeOrPromise);
      }
    }

    return rMachine.config.defaultLocale;
  }

  function storeLocale(locale: string): string | Promise<string> {
    if (strategyConfig.localeStore !== undefined) {
      const setResult = strategyConfig.localeStore.set(locale);
      if (setResult instanceof Promise) {
        return setResult.then(() => locale);
      }
    }

    return locale;
  }

  function detectAndStoreLocale(): string | Promise<string> {
    const localeOrPromise = detectLocale();

    if (localeOrPromise instanceof Promise) {
      return localeOrPromise.then(storeLocale);
    } else {
      return storeLocale(localeOrPromise);
    }
  }

  return {
    readLocale() {
      // If locale is stored, return it
      if (strategyConfig.localeStore !== undefined) {
        const localeOrPromise = strategyConfig.localeStore.get();
        if (localeOrPromise instanceof Promise) {
          return localeOrPromise.then((locale) => {
            if (locale !== undefined) {
              // Validation for returned locale is performed by the caller
              return locale;
            } else {
              return detectAndStoreLocale();
            }
          });
        } else if (localeOrPromise !== undefined) {
          // Validation for returned locale is performed by the caller
          return localeOrPromise;
        }
      }

      return detectAndStoreLocale();
    },

    writeLocale(newLocale) {
      if (strategyConfig.localeStore) {
        return strategyConfig.localeStore.set(newLocale);
      }
    },
  };
};
