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
import type { AnyFmtProvider, AnyResourceAtlas, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import type { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import { type NextProxyResult, validateServerOnlyUsage } from "#r-machine/next/internal";
import type { NextAppServerImpl } from "../next-app-server-toolset.js";
import { localeHeaderName } from "../next-app-strategy-core.js";
import type { AnyNextAppFlatStrategyConfig } from "./next-app-flat-strategy-core.js";

const scPathHeaderName = "x-rm-scpath"; // Static Canonical Path

export async function createNextAppFlatServerImpl<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  FP extends AnyFmtProvider,
  C extends AnyNextAppFlatStrategyConfig,
>(
  rMachine: RMachine<RA, L, FP>,
  strategyConfig: C,
  pathTranslator: HrefTranslator,
  pathCanonicalizer: HrefCanonicalizer
) {
  const { locales, localeHelper } = rMachine;
  const { autoLocaleBinding, cookie, pathMatcher } = strategyConfig;
  const localeKey = strategyConfig.localeKey as C["localeKey"]; // Type assertion needed to use localeKey in a typed way, since it's not a generic parameter of the strategy core class
  const autoLBSw = autoLocaleBinding === "on";
  const { name: cookieName, ...cookieConfig } = cookie;

  return {
    localeKey,
    autoLocaleBinding: autoLBSw,

    async writeLocale(locale, newLocale, cookies, headers) {
      if (newLocale === locale) {
        return;
      }

      const headersStore = await headers();
      const contentPath = headersStore.get(scPathHeaderName);
      let path: string;
      if (contentPath !== null) {
        // Use path from header if available
        path = pathTranslator.get(newLocale, contentPath).value;
      } else {
        // Fallback
        path = pathTranslator.get(newLocale, "/").value;
      }

      try {
        const cookieStore = await cookies();
        cookieStore.set(cookieName!, newLocale, cookieConfig);
      } catch {
        // SetLocale not invoked in a Server Action or Route Handler.
        console.warn(
          `[r-machine] Warning: Unable to set locale cookie '${cookieName}'. Make sure to call 'setLocale' from a Server Action or Route Handler.`
        );
      }
      redirect(path);
    },

    createLocaleStaticParamsGenerator() {
      return async () =>
        locales.map((locale: L) => ({
          [localeKey]: locale,
        }));
    },

    createProxy() {
      function getLocaleFromCookie(request: NextRequest): L | undefined {
        const cookieLocale = request.cookies.get(cookieName!)?.value;
        if (cookieLocale === undefined) {
          return undefined;
        }

        if (!locales.includes(cookieLocale as L)) {
          return undefined;
        }

        return cookieLocale as L;
      }

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

      function proxy(request: NextRequest): NextProxyResult {
        const pathname = request.nextUrl.pathname;

        if (pathMatcher === null || pathMatcher.test(pathname)) {
          // Is an handled path
          const cookieLocale = getLocaleFromCookie(request);

          let locale: L;
          if (cookieLocale !== undefined) {
            // Cookie available, use locale from cookie
            locale = cookieLocale;
          } else {
            // First time visiting, auto-detect from Accept-Language header
            locale = localeHelper.matchLocalesForAcceptLanguageHeader(request.headers.get("accept-language"));
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
