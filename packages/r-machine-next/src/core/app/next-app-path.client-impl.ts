import Cookies from "js-cookie";
import type { AnyResourceAtlas, RMachine } from "r-machine";
import { defaultCookieDeclaration } from "r-machine/strategy/web";
import type { HrefResolver } from "#r-machine/next/core";
import { setCookie } from "#r-machine/next/internal";
import type { NextAppClientImpl } from "./next-app-client-toolset.js";
import type { AnyNextAppPathStrategyConfig } from "./next-app-path-strategy-core.js";

const pathComposerNormalizerRegExp = /^\//;

export async function createNextAppPathClientImpl(
  rMachine: RMachine<AnyResourceAtlas>,
  strategyConfig: AnyNextAppPathStrategyConfig,
  _resolveHref: HrefResolver
) {
  const { cookie } = strategyConfig;
  const lowercaseLocale = strategyConfig.lowercaseLocale === "on";
  const implicitDefaultLocale = strategyConfig.implicitDefaultLocale !== "off";
  const defaultLocale = rMachine.config.defaultLocale;
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

    createUsePathComposer(useLocale) {
      function getPathComposer() {
        const locale = useLocale();

        function getPath(path: string): string {
          let localeParam: string;
          if (implicitDefaultLocale && locale === defaultLocale) {
            localeParam = "";
          } else {
            localeParam = `/${lowercaseLocale ? locale.toLowerCase() : locale}`;
          }
          return `${localeParam}/${path.replace(pathComposerNormalizerRegExp, "")}`;
        }

        return getPath;
      }

      return getPathComposer;
    },
  } as NextAppClientImpl;
}
