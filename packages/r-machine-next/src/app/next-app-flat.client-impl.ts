import Cookies from "js-cookie";
import type { ImplFactory } from "r-machine/strategy";
import type { NextClientImpl } from "#r-machine/next/core";
import type { AnyNextAppFlatStrategyConfig } from "#r-machine/next/core/app";
import { setCookie } from "#r-machine/next/internal";

export const createNextAppFlatClientImpl: ImplFactory<NextClientImpl, AnyNextAppFlatStrategyConfig> = async (
  _rMachine,
  strategyConfig
) => {
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
  };
};
