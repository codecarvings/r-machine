import Cookies from "js-cookie";
import type { ImplFactory } from "r-machine/strategy";
import { defaultCookieDeclaration } from "r-machine/strategy/web";
import type { NextClientImpl } from "#r-machine/next/core";
import type { NextAppPathStrategyConfig } from "./next-app-path-strategy.js";

export const createNextAppPathClientImpl: ImplFactory<NextClientImpl, NextAppPathStrategyConfig<string>> = async (
  rMachine,
  strategyConfig
) => {
  const { cookie } = strategyConfig;
  const lowercaseLocale = strategyConfig.lowercaseLocale === "on";
  const implicitDefaultLocale = strategyConfig.implicitDefaultLocale !== "off";
  const defaultLocale = rMachine.config.defaultLocale;

  const cookieSw = cookie !== "off";
  let setLocaleCookie: ((locale: string) => void) | undefined;

  let onLoad: NextClientImpl["onLoad"];
  if (cookieSw) {
    const { name: cookieName, ...cookieOptions } = cookie === "on" ? defaultCookieDeclaration : cookie;

    setLocaleCookie = (locale: string) => {
      Cookies.set(cookieName, locale, {
        domain: cookieOptions.domain,
        path: cookieOptions.path,
        expires: cookieOptions.maxAge !== undefined ? new Date(Date.now() + cookieOptions.maxAge * 1000) : undefined,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
      });
    };

    onLoad = (locale) => {
      const localeCookie = Cookies.get(cookieName);
      if (locale !== localeCookie) {
        // 1) Set cookie on load (required when not using the proxy)
        setLocaleCookie!(locale);
      }
    };
  }

  return {
    writeLocale(newLocale, router) {
      if (setLocaleCookie !== undefined) {
        // 2) Set cookie on write (required when implicitDefaultLocale is on - problem with double redirect on explicit path)
        setLocaleCookie(newLocale);
      }

      let localeParam: string;
      if (implicitDefaultLocale && newLocale === defaultLocale) {
        localeParam = "";
      } else {
        localeParam = lowercaseLocale ? newLocale.toLowerCase() : newLocale;
      }
      const path = `/${localeParam}`;
      console.dir(router);
      router.push(path);
    },
    onLoad,
  };
};
