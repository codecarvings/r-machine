import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { HrefResolver } from "#r-machine/next/core";
import {
  type CookiesFn,
  type HeadersFn,
  type NextProxyResult,
  validateServerOnlyUsage,
} from "#r-machine/next/internal";
import type { AnyNextAppOriginStrategyConfig } from "./next-app-origin-strategy-core.js";
import type { NextAppServerImpl } from "./next-app-server-toolset.js";
import { localeHeaderName } from "./next-app-strategy-core.js";

export async function createNextAppOriginServerImpl(
  rMachine: RMachine<AnyResourceAtlas>,
  strategyConfig: AnyNextAppOriginStrategyConfig,
  resolveOrigin: (locale: string) => string,
  resolveHref: HrefResolver
) {
  const defaultLocale = rMachine.config.defaultLocale;
  const { localeKey, autoLocaleBinding, localeOriginMap, pathMatcher } = strategyConfig;
  const autoLBSw = autoLocaleBinding === "on";

  return {
    localeKey,
    autoLocaleBinding: autoLBSw,

    async writeLocale(newLocale, _cookies: CookiesFn, headers: HeadersFn) {
      const headerStore = await headers();
      const currentOrigin = headerStore.get("origin");
      const newOrigin = resolveOrigin(newLocale);
      if (newOrigin !== currentOrigin) {
        // Redirect only if the origin for the new locale is different
        // (bug in Next.js when redirecting to the same origin)
        redirect(newOrigin);
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

          if (autoLBSw) {
            // Bind locale to request headers
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set(localeHeaderName, locale!);
            return NextResponse.rewrite(newUrl, {
              request: {
                headers: requestHeaders,
              },
            });
          }

          // No locale binding needed
          return NextResponse.rewrite(newUrl);
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

        return (path, params) => {
          return resolveHref(true, locale, path, params);
        };
      };
    },
  } as NextAppServerImpl;
}
