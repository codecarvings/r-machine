import type { AnyFmtProvider, AnyResourceAtlas, RMachine } from "r-machine";
import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "r-machine/errors";
import type { AnyLocale } from "r-machine/locale";
import type { ReactStandardStrategyConfig } from "./react-standard-strategy-core.js";
import type { ReactImpl } from "./react-toolset.js";

export async function createReactStandardImpl<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  FP extends AnyFmtProvider,
>(rMachine: RMachine<RA, L, FP>, strategyConfig: ReactStandardStrategyConfig): Promise<ReactImpl<L>> {
  function returnValidLocale(locale: AnyLocale): L {
    const error = rMachine.localeHelper.validateLocale(locale);
    if (error) {
      throw new RMachineUsageError(ERR_UNKNOWN_LOCALE, `Invalid locale detected: ${locale}.`, error);
    }

    return locale as L;
  }

  function detectLocale(): L | Promise<L> {
    if (strategyConfig.localeDetector !== undefined) {
      const localeOrPromise = strategyConfig.localeDetector();
      if (localeOrPromise instanceof Promise) {
        return localeOrPromise.then(returnValidLocale);
      } else {
        return returnValidLocale(localeOrPromise);
      }
    }

    return rMachine.defaultLocale;
  }

  function storeLocale(locale: L): L | Promise<L> {
    if (strategyConfig.localeStore !== undefined) {
      const setResult = strategyConfig.localeStore.set(locale);
      if (setResult instanceof Promise) {
        return setResult.then(() => locale);
      }
    }

    return locale;
  }

  function detectAndStoreLocale(): L | Promise<L> {
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
              return locale as L;
            } else {
              return detectAndStoreLocale();
            }
          });
        } else if (localeOrPromise !== undefined) {
          // Validation for returned locale is performed by the caller
          return localeOrPromise as L;
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
}
