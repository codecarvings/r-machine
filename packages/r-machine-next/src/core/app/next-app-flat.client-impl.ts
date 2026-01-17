import Cookies from "js-cookie";
import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { HrefResolver } from "#r-machine/next/core";
import { setCookie } from "#r-machine/next/internal";
import type { NextAppClientImpl } from "./next-app-client-toolset.js";
import type { AnyNextAppFlatStrategyConfig } from "./next-app-flat-strategy-core.js";

export async function createNextAppFlatClientImpl(
  _rMachine: RMachine<AnyResourceAtlas>,
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
          return resolveHref(true, locale, path, params);
        };
      };
    },
  } as NextAppClientImpl;
}
