import Cookies from "js-cookie";
import type { AnyResourceAtlas, RMachine } from "r-machine";
import { defaultCookieDeclaration } from "r-machine/strategy/web";
import type { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import { setCookie } from "#r-machine/next/internal";
import type { NextAppClientImpl } from "../next-app-client-toolset.js";
import type { AnyNextAppPathStrategyConfig } from "./next-app-path-strategy-core.js";

// const pathComposerNormalizerRegExp = /^\//;

export async function createNextAppPathClientImpl(
  _rMachine: RMachine<AnyResourceAtlas>,
  strategyConfig: AnyNextAppPathStrategyConfig,
  pathTranslator: HrefTranslator,
  pathCanonicalizer: HrefCanonicalizer
) {
  const { cookie } = strategyConfig;
  const cookieSw = cookie !== "off";
  const { name: cookieName, ...cookieConfig } = cookieSw ? (cookie === "on" ? defaultCookieDeclaration : cookie) : {};

  let onLoad: NextAppClientImpl["onLoad"];
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

    writeLocale(locale, newLocale, pathname, router) {
      if (newLocale === locale) {
        return;
      }

      if (cookieSw) {
        // 2) Set cookie on write (required when implicitDefaultLocale is on - problem with double redirect on explicit path)
        setCookie(cookieName!, newLocale, cookieConfig);
      }

      const contentPath = pathCanonicalizer.get(locale, pathname);
      let newPath: string;
      if (contentPath.dynamic) {
        // If dynamic, translation of slugs is not available, redirect to root
        newPath = pathTranslator.get(newLocale, "/").value;
      } else {
        // Static path, surely no params
        newPath = pathTranslator.get(newLocale, contentPath.value).value;
      }
      router.push(newPath);
    },

    createUsePathComposer: (useLocale) => {
      return () => {
        const locale = useLocale();

        return (path, params) => pathTranslator.get(locale, path, params).value;
      };
    },
  } as NextAppClientImpl;
}
