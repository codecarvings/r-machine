import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import { type NextProxyResult, validateServerOnlyUsage } from "#r-machine/next/internal";
import type { NextAppServerImpl } from "../next-app-server-toolset.js";
import { localeHeaderName } from "../next-app-strategy-core.js";
import type { AnyNextAppOriginStrategyConfig } from "./next-app-origin-strategy-core.js";

const scPathHeaderName = "x-rm-scpath"; // Static Canonical Path

export async function createNextAppOriginServerImpl(
  rMachine: RMachine<AnyResourceAtlas>,
  strategyConfig: AnyNextAppOriginStrategyConfig,
  pathTranslator: HrefTranslator,
  urlTranslator: HrefTranslator,
  pathCanonicalizer: HrefCanonicalizer
) {
  const defaultLocale = rMachine.config.defaultLocale;
  const { localeKey, autoLocaleBinding, localeOriginMap, pathMatcher } = strategyConfig;
  const autoLBSw = autoLocaleBinding === "on";

  return {
    localeKey,
    autoLocaleBinding: autoLBSw,

    async writeLocale(locale, newLocale, _cookies, headers) {
      if (newLocale === locale) {
        return;
      }

      const headersStore = await headers();
      const contentPath = headersStore.get(scPathHeaderName);
      let url: string;
      if (contentPath !== null) {
        // Use path from header if available
        url = urlTranslator.get(newLocale, contentPath).value;
      } else {
        // Fallback
        url = urlTranslator.get(newLocale, "/").value;
      }

      redirect(url);
    },

    createLocaleStaticParamsGenerator() {
      return async () =>
        rMachine.config.locales.map((locale: string) => ({
          [localeKey]: locale,
        }));
    },

    createProxy() {
      function rewriteToCanonicalLocalePath(request: NextRequest, locale: string, path: string): NextResponse {
        // Rewrite to locale-prefixed URL internally - basePath already included
        const newUrl = request.nextUrl.clone();
        // Reconstruct canonical URL
        const canonicalPath = pathCanonicalizer.get(locale, path);
        newUrl.pathname = `/${locale!}${canonicalPath.value}`;

        const changeHeaders = autoLBSw || !canonicalPath.dynamic;
        if (!changeHeaders) {
          return NextResponse.rewrite(newUrl);
        }

        const requestHeaders = new Headers(request.headers);
        if (!canonicalPath.dynamic) {
          // Set static canonical path header
          requestHeaders.set(scPathHeaderName, canonicalPath.value);
        }
        if (autoLBSw) {
          // Bind locale to request headers
          requestHeaders.set(localeHeaderName, locale);
        }
        return NextResponse.rewrite(newUrl, {
          request: {
            headers: requestHeaders,
          },
        });
      }

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

          return rewriteToCanonicalLocalePath(request, locale, pathname);
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
