/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/next, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import type { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import { type NextProxyResult, validateServerOnlyUsage } from "#r-machine/next/internal";
import type { NextAppServerImpl } from "../next-app-server-toolset.js";
import { localeHeaderName } from "../next-app-strategy-core.js";
import type { AnyNextAppOriginStrategyConfig } from "./next-app-origin-strategy-core.js";

const scPathHeaderName = "x-rm-scpath"; // Static Canonical Path

export async function createNextAppOriginServerImpl<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  C extends AnyNextAppOriginStrategyConfig,
>(
  rMachine: RMachine<RA, L>,
  strategyConfig: C,
  pathTranslator: HrefTranslator,
  urlTranslator: HrefTranslator,
  pathCanonicalizer: HrefCanonicalizer
) {
  const defaultLocale = rMachine.config.defaultLocale;
  const { autoLocaleBinding, localeOriginMap, pathMatcher } = strategyConfig;
  const localeKey = strategyConfig.localeKey as C["localeKey"]; // Type assertion needed to use localeKey in a typed way, since it's not a generic parameter of the strategy core class
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
        rMachine.config.locales.map((locale: L) => ({
          [localeKey]: locale,
        }));
    },

    createProxy() {
      function rewriteToCanonicalLocalePath(request: NextRequest, locale: L, path: string): NextResponse {
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

      const originCacheMap = new Map<string, L>();
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
                  locale = mapLocale as L;
                  break;
                }
              } else {
                if (mapOrigin.includes(origin)) {
                  locale = mapLocale as L;
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
  } as NextAppServerImpl<L, C["localeKey"]>;
}
