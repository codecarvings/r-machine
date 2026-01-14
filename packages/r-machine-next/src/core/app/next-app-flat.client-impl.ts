import Cookies from "js-cookie";
import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { HrefResolver } from "#r-machine/next/core";
import { setCookie } from "#r-machine/next/internal";
import type { NextAppClientImpl } from "./next-app-client-toolset.js";
import type { AnyNextAppFlatStrategyConfig } from "./next-app-flat-strategy-core.js";

export async function createNextAppFlatClientImpl(
  rMachine: RMachine<AnyResourceAtlas>,
  strategyConfig: AnyNextAppFlatStrategyConfig,
  resolveHref: HrefResolver
) {
  const { cookie } = strategyConfig;
  const { name: cookieName, ...cookieConfig } = cookie;

  return {
    onLoad(locale) {
      const cookieLocale = Cookies.get(cookieName);
      if (locale !== cookieLocale) {
        setCookie(cookieName, locale, cookieConfig);
      }
    },

    writeLocale(newLocale, router) {
      setCookie(cookieName, newLocale, cookieConfig);
      router.refresh();
    },

    createUsePathComposer: (useLocale) => {
      return () => {
        const locale = useLocale();

        return (path, params) => {
          let selectedLocale = locale;
          let explicit = false;
          if (params !== undefined) {
            const { paramLocale, ...otherParams } = params;
            if (paramLocale !== undefined) {
              // Override locale from params
              selectedLocale = paramLocale;
              rMachine.localeHelper.validateLocale(selectedLocale);
              explicit = true;
            }
            params = otherParams as any;
          }
          return resolveHref(explicit ? "bound-explicit" : "bound", selectedLocale, path, params);
        };
      };
    },
  } as NextAppClientImpl;
}
