import Cookies from "js-cookie";
import type { ImplFactory } from "r-machine/strategy";
import { defaultCookieDeclaration } from "r-machine/strategy/web";
import type { NextClientImpl } from "#r-machine/next/core";
import type {
  NextAppPersistentClientImplSubset,
  NextAppPersistentStrategyConfig,
} from "./next-app-persistent-strategy.js";

export const createNextAppPersistentClientImplSubset: ImplFactory<
  NextAppPersistentClientImplSubset,
  NextAppPersistentStrategyConfig<string>
> = async (_rMachine, strategyConfig) => {
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

  return {
    setLocaleCookie,
  };
};
