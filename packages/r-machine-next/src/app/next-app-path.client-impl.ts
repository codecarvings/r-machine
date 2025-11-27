import Cookies from "js-cookie";
import type { ImplFactory } from "r-machine/strategy";
import { defaultCookieDeclaration } from "r-machine/strategy/web";
import type { NextClientImpl } from "#r-machine/next/core";
import { setCookie } from "#r-machine/next/internal";
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
  const { name: cookieName, ...cookieConfig } = cookieSw ? (cookie === "on" ? defaultCookieDeclaration : cookie) : {};

  let onLoad: NextClientImpl["onLoad"];
  if (cookieSw) {
    onLoad = (locale) => {
      const cookieLocale = Cookies.get(cookieName!);
      if (locale !== cookieLocale) {
        // 1) Set cookie on load (required when not using the proxy)
        setCookie(cookieName!, locale, cookieConfig);
      }
    };
  }

  return {
    onLoad,

    writeLocale(newLocale, router) {
      if (cookieSw) {
        // 2) Set cookie on write (required when implicitDefaultLocale is on - problem with double redirect on explicit path)
        setCookie(cookieName!, newLocale, cookieConfig);
      }

      let localeParam: string;
      if (implicitDefaultLocale && newLocale === defaultLocale) {
        localeParam = "";
      } else {
        localeParam = lowercaseLocale ? newLocale.toLowerCase() : newLocale;
      }
      const path = `/${localeParam}`;
      router.push(path);
    },
  };
};
