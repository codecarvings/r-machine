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
import type { RMachine } from "r-machine";
import type { AnyResAtlas, AnyResEquipment, ExperimentalFlags } from "r-machine/core";
import { RMachineConfigError } from "r-machine/errors";
import { type AnyLocale, getCanonicalUnicodeLocaleId } from "r-machine/locale";
import { defaultCookieDeclaration } from "r-machine/strategy/web";
import { type HrefCanonicalizer, type HrefTranslator, localeHeaderName } from "#r-machine/next/core";
import type { NextAppNoProxyServerImpl } from "#r-machine/next/core/app";
import { ERR_FEATURE_REQUIRES_PROXY } from "#r-machine/next/errors";
import { type CookiesFn, defaultPathMatcher, type HeadersFn, type NextProxyResult } from "#r-machine/next/internal";
import type { AnyNextAppPathStrategyConfig } from "./next-app-path-strategy-core.js";

const sccPathHeaderName = "x-rm-sccpath"; // Static Canonical Content Path
// Next strips its own RSC markers (`rsc`, `next-router-prefetch`) before the proxy runs
// (measured on Next 16.3), so they cannot be used here. `next-url` is what survives: the
// client router sends it on every RSC request, and a browser never sends it on a document
// navigation. `sec-fetch-dest` is the second-opinion marker for the same distinction.
const nextUrlHeaderName = "next-url";
const secFetchDestHeaderName = "sec-fetch-dest";

const default_autoDL_matcher_implicit: RegExp | null = /^\/$/; // Auto detect only root path
const default_autoDL_matcher_explicit: RegExp | null = defaultPathMatcher; // Auto detect all standard next paths
const default_implicit_matcher: RegExp | null = defaultPathMatcher; // Implicit for all standard paths

export async function createNextAppPathServerImpl<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends AnyResEquipment<RA>,
  EF extends ExperimentalFlags,
  C extends AnyNextAppPathStrategyConfig,
>(
  rMachine: RMachine<RA, L, E, EF>,
  strategyConfig: C,
  pathTranslator: HrefTranslator,
  contentPathCanonicalizer: HrefCanonicalizer
) {
  const { locales, defaultLocale, matchLocalesForAcceptLanguageHeader } = rMachine.localeHelper;
  const {
    autoLocaleBinding,
    basePath,
    cookie,
    localeLabel,
    autoDetectLocale,
    implicitDefaultLocale,
    localeCacheControl,
  } = strategyConfig;
  const localeKey = strategyConfig.localeKey as C["localeKey"]; // Type assertion needed to use localeKey in a typed way, since it's not a generic parameter of the strategy core class

  const autoLBSw = autoLocaleBinding === "on";
  const lowercaseLocaleSw = localeLabel === "lowercase";
  const implicitSw = implicitDefaultLocale !== "off";
  const autoDLSw = autoDetectLocale !== "off";
  const cookieSw = cookie !== "off";
  const privateCacheSw = localeCacheControl === "private";
  const { name: cookieName, ...cookieConfig } = cookieSw ? (cookie === "on" ? defaultCookieDeclaration : cookie) : {};

  const writeLocale = async (locale: L, newLocale: L, cookies: CookiesFn, headers: HeadersFn) => {
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
  };

  return {
    localeKey,
    autoLocaleBinding: autoLBSw,

    writeLocale,

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

      // The auto-detect branch picks the locale from these request headers, so every
      // response it produces must declare the dependency — the rewrite included, since
      // that one is a cacheable 200.
      const autoDetectVary = cookieSw ? "Accept-Language, Cookie" : "Accept-Language";

      function declareAutoDetectDependency<R extends NextResponse>(response: R): R {
        // Append, not set: Next declares its own RSC headers here and must not be clobbered.
        // Measured on Next 16.3: this survives on a redirect but is overwritten on a rewrite,
        // where Next owns `vary` (neither the proxy nor next.config `headers()` can add to it).
        // Declared on both anyway — it is correct where the response is produced.
        response.headers.append("vary", autoDetectVary);

        // `vary` alone therefore cannot carry the dependency on the outcome that matters most:
        // the rewrite is a cacheable 200, and it inherits the `cache-control` of the page it
        // rewrites to — for a prerendered target, `s-maxage` measured in months. That is the
        // header of the canonical locale-prefixed URL, correct there and wrong here, where the
        // response was chosen from a cookie: a URL-keyed shared cache would store it under the
        // requested URL and serve it to everyone, silently disabling auto-detect for whoever did
        // not warm it. `cache-control` does survive the rewrite, so it is the only remaining way
        // to say it. `no-cache` rather than `no-store` — a private cache may keep the response,
        // it just has to revalidate, which it must anyway once the locale cookie changes.
        if (privateCacheSw) {
          response.headers.set("cache-control", "private, no-cache");
        }
        return response;
      }

      function isDocumentRequest(request: NextRequest): boolean {
        if (request.headers.get(nextUrlHeaderName) !== null) {
          // Client-router request (navigation or prefetch)
          return false;
        }
        const fetchDest = request.headers.get(secFetchDestHeaderName);
        // Absent means a client that sends no `sec-fetch-*` (curl, older bots): treat it as
        // a document request, so auto-detect keeps working for everything but the RSC path.
        return fetchDest === null || fetchDest === "document";
      }

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
        const localeSeg = lowercaseLocaleSw ? locale.toLowerCase() : locale;
        // Avoid a trailing slash for the locale root ("/") to keep the rewritten
        // pathname consistent with the redirect/href forms (no "/en/" vs "/en").
        newUrl.pathname =
          canonicalContentPath.value === "/" ? `/${localeSeg}` : `/${localeSeg}${canonicalContentPath.value}`;

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
          // Standard locale-prefixed URL — avoid a trailing slash on root ("/"),
          // which Next (trailingSlash:false) would re-normalize, causing a 2nd redirect
          const localeSeg = lowercaseLocaleSw ? locale.toLowerCase() : locale;
          url = new URL(`${basePath}/${localeSeg}${pathname === "/" ? "" : pathname}`, request.url);
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
            if (autoDLSw && (autoDLRegExp === null || autoDLRegExp.test(pathname))) {
              // Is auto-detect URL

              // Auto-detect is an entrance concern, so it applies to document requests only.
              // The client router keys its prefetch cache by URL alone and ignores `vary`:
              // a cookie-dependent redirect served to an RSC request would be stored under
              // the requested URL and replayed after the cookie changes — a locale switch
              // back to the default locale would then land on the previous locale. An RSC
              // request always gets the canonical content of the URL it asked for, which
              // for an implicit URL is the default locale.
              if (isDocumentRequest(request)) {
                const cookieLocale = getLocaleFromCookie(request);

                let locale: L;
                if (cookieLocale !== undefined) {
                  // Cookie enabled and available, use locale from cookie
                  locale = cookieLocale;
                } else {
                  // Cookie disabled - OR - First time visiting, auto-detect from Accept-Language header
                  locale = matchLocalesForAcceptLanguageHeader(request.headers.get("accept-language"));
                }

                if (locale !== defaultLocale) {
                  // Redirect to the URL with the locale prefix
                  return declareAutoDetectDependency(redirectToCanonicalLocalePath(request, locale, pathname, false));
                }

                // Default locale detected: rewrite, the other outcome of the same header-dependent choice
                return declareAutoDetectDependency(rewriteToCanonicalLocalePath(request, locale, pathname));
              }
              // RSC request: the outcome no longer depends on Cookie/Accept-Language, so it
              // carries no `vary` beyond the `rsc` one Next declares on its own.
            }

            // Non auto-detect URL - OR - RSC request on an auto-detect URL: always use the
            // default locale. Rewrite to locale-prefixed URL internally - basePath already included
            return rewriteToCanonicalLocalePath(request, defaultLocale, pathname);
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
            locale = matchLocalesForAcceptLanguageHeader(request.headers.get("accept-language"));
          }

          // Redirect to the URL with the locale prefix.
          // No RSC exemption here, unlike the implicit branch: without implicit URLs an
          // unprefixed path has no canonical content of its own, so the redirect is the
          // only possible outcome and the switcher never navigates to such a path.
          return declareAutoDetectDependency(redirectToCanonicalLocalePath(request, locale, pathname, false));
        }

        // Not an auto-detect URL
        // Irrelevant URL, do not proxy
        return NextResponse.next();
      }

      return proxy;
    },

    createRouteHandlers(cookies, headers) {
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
          await writeLocale(undefined!, cookieLocale, cookies, headers);
        }

        const headerStore = await headers();
        const acceptLanguageHeader = headerStore.get("accept-language");
        const detectedLocale = matchLocalesForAcceptLanguageHeader(acceptLanguageHeader);
        await writeLocale(undefined!, detectedLocale, cookies, headers);
      }

      return { entrance: { GET: entranceGet } };
    },

    createPathComposer: (locale) => (path, params) => pathTranslator.get(locale, path, params).value,
  } as NextAppNoProxyServerImpl<L, C["localeKey"]>;
}
