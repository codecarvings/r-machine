import Cookies from "js-cookie";
import { defaultCookieDeclaration } from "r-machine/strategy";
import type { NextClientImpl } from "#r-machine/next/core";
import type { NextAppPersistentStrategyConfig } from "./next-app-persistent-strategy.js";

export function createSetLocaleCookieForNextClientImpl(
  strategyConfig: NextAppPersistentStrategyConfig<string>
): NextClientImpl["setLocaleCookie"] {
  const { cookie } = strategyConfig;

  let setLocaleCookie: NextClientImpl["setLocaleCookie"];
  if (cookie !== "off") {
    const { name: cookieName, ...cookieOptions } = cookie === "on" ? defaultCookieDeclaration : cookie;

    setLocaleCookie = (locale) => {
      const localeCookie = Cookies.get(cookieName);
      if (locale !== localeCookie) {
        Cookies.set(cookieName, locale, {
          domain: cookieOptions.domain,
          path: cookieOptions.path,
          expires: cookieOptions.maxAge !== undefined ? new Date(Date.now() + cookieOptions.maxAge * 1000) : undefined,
          secure: cookieOptions.secure,
          sameSite: cookieOptions.sameSite,
        });
      }
    };
  }

  return setLocaleCookie;
}
