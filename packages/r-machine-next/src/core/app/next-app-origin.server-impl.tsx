import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { HrefTranslator } from "#r-machine/next/core";
import { type NextProxyResult, validateServerOnlyUsage } from "#r-machine/next/internal";
import type { AnyNextAppOriginStrategyConfig } from "./next-app-origin-strategy-core.js";
import type { NextAppServerImpl } from "./next-app-server-toolset.js";
import { localeHeaderName } from "./next-app-strategy-core.js";

export const originHeaderName = "x-rm-origin";

export async function createNextAppOriginServerImpl(
  rMachine: RMachine<AnyResourceAtlas>,
  strategyConfig: AnyNextAppOriginStrategyConfig,
  pathTranslator: HrefTranslator,
  urlTranslator: HrefTranslator
) {
  const defaultLocale = rMachine.config.defaultLocale;
  const { localeKey, autoLocaleBinding, localeOriginMap, pathMatcher } = strategyConfig;
  const autoLBSw = autoLocaleBinding === "on";

  return {
    localeKey,
    autoLocaleBinding: autoLBSw,

    async writeLocale(_locale, newLocale, _cookies, headers) {
      const headerStore = await headers();
      const currentOrigin = headerStore.get(originHeaderName);
      const newUrl = urlTranslator.get(newLocale, "/").value;
      const newOrigin = new URL(newUrl).origin;
      if (newOrigin !== currentOrigin) {
        // Redirect only if the origin for the new locale is different
        // (bug in Next.js when redirecting to the same origin)
        redirect(newUrl);
      }
    },

    createLocaleStaticParamsGenerator() {
      return async () =>
        rMachine.config.locales.map((locale: string) => ({
          [localeKey]: locale,
        }));
    },

    createProxy() {
      const originCacheMap = new Map<string, string>();
      function proxy(request: NextRequest): NextProxyResult {
        const { pathname } = request.nextUrl;
        if (pathMatcher === null || pathMatcher.test(pathname)) {
          // Is an handled path
          // Do not use origin from request.nextUrl since it return "localhost" in dev mode
          const origin = `${request.nextUrl.protocol}//${request.headers.get("host")}`;

          let locale = originCacheMap.get(origin);
          if (locale === undefined) {
            // Not in cache, determine locale from origin
            for (const [mapLocale, mapOrigin] of Object.entries(localeOriginMap)) {
              if (typeof mapOrigin === "string") {
                if (mapOrigin === origin) {
                  locale = mapLocale;
                  break;
                }
              } else {
                if (mapOrigin.includes(origin)) {
                  locale = mapLocale;
                  break;
                }
              }
            }

            if (locale === undefined) {
              // Origin not found in map, use default locale
              locale = defaultLocale;
            }

            originCacheMap.set(origin, locale!);
          }

          // Rewrite to locale-prefixed URL internally - basePath already included
          const newUrl = request.nextUrl.clone();
          newUrl.pathname = `/${locale!}${pathname}`;

          const requestHeaders = new Headers(request.headers);
          // Ensure origin header is set
          requestHeaders.set(originHeaderName, origin);
          if (autoLBSw) {
            // Bind locale to request headers
            requestHeaders.set(localeHeaderName, locale!);
          }
          return NextResponse.rewrite(newUrl, {
            request: {
              headers: requestHeaders,
            },
          });
        }

        // Irrelevant URL, do not proxy
        return NextResponse.next();
      }

      return proxy;
    },

    createBoundPathComposerSupplier: (getLocale) => {
      return async () => {
        validateServerOnlyUsage("getPathComposer");
        const locale = await getLocale();

        return (path, params) => pathTranslator.get(locale, path, params).value;
      };
    },
  } as NextAppServerImpl;
}
