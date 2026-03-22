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
import { RMachineConfigError } from "r-machine/errors";
import { type AnyLocale, getCanonicalUnicodeLocaleId } from "r-machine/locale";
import { defaultCookieDeclaration } from "r-machine/strategy/web";
import type { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import { ERR_FEATURE_REQUIRES_PROXY } from "#r-machine/next/errors";
import { defaultPathMatcher, type NextProxyResult, validateServerOnlyUsage } from "#r-machine/next/internal";
import type { NextAppNoProxyServerImpl } from "../next-app-no-proxy-server-toolset.js";
import { localeHeaderName } from "../next-app-strategy-core.js";
import type { AnyNextAppPathStrategyConfig } from "./next-app-path-strategy-core.js";

const sccPathHeaderName = "x-rm-sccpath"; // Static Canonical Content Path

const default_autoDL_matcher_implicit: RegExp | null = /^\/$/; // Auto detect only root path
const default_autoDL_matcher_explicit: RegExp | null = defaultPathMatcher; // Auto detect all standard next paths
const default_implicit_matcher: RegExp | null = defaultPathMatcher; // Implicit for all standard paths

export async function createNextAppPathServerImpl<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  FP extends AnyFmtProvider,
  C extends AnyNextAppPathStrategyConfig,
>(
  rMachine: RMachine<RA, L, FP>,
  strategyConfig: C,
  pathTranslator: HrefTranslator,
  contentPathCanonicalizer: HrefCanonicalizer
) {
  const { locales, defaultLocale, localeHelper } = rMachine;
  const { autoLocaleBinding, basePath, cookie, localeLabel, autoDetectLocale, implicitDefaultLocale } = strategyConfig;
  const localeKey = strategyConfig.localeKey as C["localeKey"]; // Type assertion needed to use localeKey in a typed way, since it's not a generic parameter of the strategy core class

  const autoLBSw = autoLocaleBinding === "on";
  const lowercaseLocaleSw = localeLabel === "lowercase";
  const implicitSw = implicitDefaultLocale !== "off";
  const autoDLSw = autoDetectLocale !== "off";
  const cookieSw = cookie !== "off";
  const { name: cookieName, ...cookieConfig } = cookieSw ? (cookie === "on" ? defaultCookieDeclaration : cookie) : {};

  return {
    localeKey,
    autoLocaleBinding: autoLBSw,

    async writeLocale(locale, newLocale, cookies, headers) {
      if (newLocale === locale) {
        return;
      }

      const headersStore = await headers();
      const contentPath = headersStore.get(sccPathHeaderName);
      let path: string;
      if (contentPath !== null) {
        // Use content path from header if available
        path = pathTranslator.get(newLocale, contentPath).value;
      } else {
        // Fallback
        path = pathTranslator.get(newLocale, "/").value;
      }

      if (cookieSw) {
        try {
          const cookieStore = await cookies();
          // 3) Set cookie on write (required when implicitDefaultLocale is on - problem with double redirect on explicit path)
          cookieStore.set(cookieName!, newLocale, cookieConfig);
        } catch {
          // SetLocale not invoked in a Server Action or Route Handler.
          console.warn(
            `[r-machine] Warning: Unable to set locale cookie '${cookieName}'. Make sure to call 'setLocale' from a Server Action or Route Handler.`
          );
        }
      }
      redirect(path);
    },

    createLocaleStaticParamsGenerator() {
      return async () =>
        locales.map((locale: L) => ({
          [localeKey]: lowercaseLocaleSw ? locale.toLowerCase() : locale,
        }));
    },

    createProxy() {
      const implicitRegExp: RegExp | null =
        typeof implicitDefaultLocale === "string"
          ? implicitDefaultLocale === "on"
            ? default_implicit_matcher
            : null
          : implicitDefaultLocale.pathMatcher;

      const autoDLRegExp: RegExp | null =
        typeof autoDetectLocale === "string"
          ? autoDetectLocale === "on"
            ? implicitSw
              ? default_autoDL_matcher_implicit
              : default_autoDL_matcher_explicit
            : null
          : autoDetectLocale.pathMatcher;

      // Use case-insensitive matching for locale codes
      const localeRegex = new RegExp(`^\\/(${locales.join("|")})(?:\\/|$)`, "i");

      function getLocaleFromCookie(request: NextRequest): L | undefined {
        if (!cookieSw) {
          return undefined;
        }

        const cookieLocale = request.cookies.get(cookieName!)?.value;
        if (cookieLocale === undefined) {
          return undefined;
        }

        if (!locales.includes(cookieLocale as L)) {
          return undefined;
        }

        return cookieLocale as L;
      }

      function rewriteToCanonicalLocalePath(request: NextRequest, locale: L, contentPath: string): NextResponse {
        // Rewrite to locale-prefixed URL internally - basePath already included
        const newUrl = request.nextUrl.clone();
        // Reconstruct canonical URL
        const canonicalContentPath = contentPathCanonicalizer.get(locale, contentPath);
        newUrl.pathname = `/${lowercaseLocaleSw ? locale.toLowerCase() : locale}${canonicalContentPath.value}`;

        const changeHeaders = autoLBSw || !canonicalContentPath.dynamic;
        if (!changeHeaders) {
          return NextResponse.rewrite(newUrl);
        }

        const requestHeaders = new Headers(request.headers);
        if (!canonicalContentPath.dynamic) {
          // Set static canonical path header
          requestHeaders.set(sccPathHeaderName, canonicalContentPath.value);
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

      function redirectToCanonicalLocalePath(
        request: NextRequest,
        locale: L,
        pathname: string,
        implicitLocale: boolean
      ): NextResponse {
        let url: URL;
        if (implicitLocale) {
          // Implicit URL - no locale prefix
          url = new URL(`${basePath}${pathname}`, request.url);
        } else {
          // Standard locale-prefixed URL
          url = new URL(`${basePath}/${lowercaseLocaleSw ? locale.toLowerCase() : locale}${pathname}`, request.url);
        }
        return NextResponse.redirect(url);
      }

      function proxy(request: NextRequest): NextProxyResult {
        const pathname = request.nextUrl.pathname;
        const match = pathname.match(localeRegex);

        if (match) {
          // Locale is present in the URL
          const providedLocale = match[1];
          const locale = getCanonicalUnicodeLocaleId(providedLocale) as L;

          if (implicitSw && locale === defaultLocale) {
            // Locale is present but canonical URL is implicit (no locale prefix)
            const response = redirectToCanonicalLocalePath(request, locale, pathname.replace(localeRegex, "/"), true);
            if (cookieSw) {
              const cookieLocale = getLocaleFromCookie(request);
              if (cookieLocale !== locale) {
                // 4) Set cookie on redirect (required when implicitDefaultLocale is on and switching to default locale)
                response.cookies.set(cookieName!, locale, cookieConfig);
              }
            }
            return response;
          }

          // Standard locale-prefixed URL
          return rewriteToCanonicalLocalePath(request, locale, pathname.replace(localeRegex, "/"));
        }

        // Locale is not present in the URL
        if (implicitSw) {
          // Use implicit URLs

          if (implicitRegExp === null || implicitRegExp.test(pathname)) {
            // Valid implicit URL
            let locale: L;
            if (autoDLSw && (autoDLRegExp === null || autoDLRegExp.test(pathname))) {
              // Is auto-detect URL
              const cookieLocale = getLocaleFromCookie(request);

              if (cookieLocale !== undefined) {
                // Cookie enabled and available, use locale from cookie
                locale = cookieLocale;
              } else {
                // Cookie disabled - OR - First time visiting, auto-detect from Accept-Language header
                locale = localeHelper.matchLocalesForAcceptLanguageHeader(request.headers.get("accept-language"));
              }

              if (locale !== defaultLocale) {
                // Redirect to the URL with the locale prefix
                return redirectToCanonicalLocalePath(request, locale, pathname, false);
              }
            } else {
              // Non auto-detect URL, always use default locale
              locale = defaultLocale;
            }

            // Rewrite to locale-prefixed URL internally - basePath already included
            return rewriteToCanonicalLocalePath(request, locale, pathname);
          }

          // Not an implicit URL, do not proxy - irrelevant for locale strategy
          return NextResponse.next();
        }

        // Do not use implicit URLs
        if (autoDLSw && (autoDLRegExp === null || autoDLRegExp.test(pathname))) {
          // Is auto-detect URL
          const cookieLocale = getLocaleFromCookie(request);

          let locale: L;
          if (cookieLocale !== undefined) {
            // Cookie enabled and available, use locale from cookie
            locale = cookieLocale;
          } else {
            // Cookie disabled - OR - First time visiting, auto-detect from Accept-Language header
            locale = localeHelper.matchLocalesForAcceptLanguageHeader(request.headers.get("accept-language"));
          }

          // Redirect to the URL with the locale prefix
          return redirectToCanonicalLocalePath(request, locale, pathname, false);
        }

        // Not an auto-detect URL
        // Irrelevant URL, do not proxy
        return NextResponse.next();
      }

      return proxy;
    },

    createRouteHandlers(cookies, headers, setLocale) {
      function throwRequiredProxyError(details: string): never {
        throw new RMachineConfigError(
          ERR_FEATURE_REQUIRES_PROXY,
          `EntranceRouteHandler is not available when some option requires the use of the proxy (${details}).`
        );
      }

      if (implicitSw) {
        throwRequiredProxyError("implicitDefaultLocale is on");
      }
      if (autoLBSw) {
        throwRequiredProxyError("autoLocaleBinding is on");
      }

      async function getLocaleFromCookie(): Promise<L | undefined> {
        if (!cookieSw) {
          return undefined;
        }

        const cookieStore = await cookies();
        const cookieLocale = cookieStore.get(cookieName!)?.value;
        if (cookieLocale === undefined) {
          return undefined;
        }

        if (!locales.includes(cookieLocale as L)) {
          return undefined;
        }

        return cookieLocale as L;
      }

      async function entranceGet() {
        const cookieLocale = await getLocaleFromCookie();
        if (cookieLocale !== undefined) {
          await setLocale(cookieLocale);
        }

        const headerStore = await headers();
        const acceptLanguageHeader = headerStore.get("accept-language");
        const detectedLocale = localeHelper.matchLocalesForAcceptLanguageHeader(acceptLanguageHeader);
        await setLocale(detectedLocale);
      }

      return { entrance: { GET: entranceGet } };
    },

    createBoundPathComposerSupplier: (getLocale) => {
      return async () => {
        validateServerOnlyUsage("getPathComposer");
        const locale = await getLocale();

        return (path, params) => pathTranslator.get(locale, path, params).value;
      };
    },
  } as NextAppNoProxyServerImpl<L, C["localeKey"]>;
}
