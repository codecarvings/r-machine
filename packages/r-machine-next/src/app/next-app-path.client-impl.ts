import Cookies from "js-cookie";
import type { ImplFactory } from "r-machine/strategy";
import { defaultCookieDeclaration } from "r-machine/strategy/web";
import type { NextClientImpl } from "#r-machine/next/core";
import type { NextAppPathStrategyConfig } from "./next-app-path-strategy.js";

export const createNextAppPathClientImpl: ImplFactory<NextClientImpl, NextAppPathStrategyConfig<string>> = async (
  rMachine,
  strategyConfig
) => {
  const { basePath, cookie } = strategyConfig;
  const lowercaseLocale = strategyConfig.lowercaseLocale === "on";
  const implicitDefaultLocale = strategyConfig.implicitDefaultLocale !== "off";
  const defaultLocale = rMachine.config.defaultLocale;

  const cookieSw = cookie !== "off";
  // Unlike server-side, setting of cookie NOT required when implicitDefaultLocale is on and switching to default locale
  // Using implicit path for consistency with server-side
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
        setLocaleCookie!(locale);
      }
    };
  }

  return {
    writeLocale(newLocale, router) {
      if (setLocaleCookie !== undefined) {
        setLocaleCookie(newLocale);
      }

      let localeParam: string;
      if (implicitDefaultLocale && newLocale === defaultLocale) {
        localeParam = "";
      } else {
        localeParam = lowercaseLocale ? newLocale.toLowerCase() : newLocale;
      }
      const path = `${basePath}/${localeParam}`;
      router.push(path);
    },
    onLoad,
  };
};
