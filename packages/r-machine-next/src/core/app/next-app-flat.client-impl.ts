import Cookies from "js-cookie";
import type { AnyAtlas, RMachine } from "r-machine";
import type { HrefResolver, NextClientImpl } from "#r-machine/next/core";
import type { AnyNextAppFlatStrategyConfig } from "#r-machine/next/core/app";
import { setCookie } from "#r-machine/next/internal";

export async function createNextAppFlatClientImpl(
  _rMachine: RMachine<AnyAtlas>,
  strategyConfig: AnyNextAppFlatStrategyConfig,
  _resolveHref: HrefResolver
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

    // TODO: Implement createUsePathComposer
    createUsePathComposer: undefined!,
  } as NextClientImpl;
}
