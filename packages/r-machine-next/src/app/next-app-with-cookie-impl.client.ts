import Cookies from "js-cookie";
import type { NextClientImpl } from "#r-machine/next/core";
import type { NextAppWithCookieStrategyConfig } from "./next-app-with-cookie-strategy.js";

export function createSetLocaleCookieForImpl(
  strategyConfig: NextAppWithCookieStrategyConfig<string>
): NextClientImpl["setLocaleCookie"] {
  const { cookie } = strategyConfig;

  let setLocaleCookie: NextClientImpl["setLocaleCookie"];
  if (cookie !== "off") {
    const { name: cookieName, ...cookieOptions } = cookie;

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
