import type { NextAppPathStrategyConfig } from "@r-machine/next/app";
import { localeHeaderName } from "@r-machine/next/core/app";
import { type NextRequest, NextResponse } from "next/server";
import { getCanonicalUnicodeLocaleId } from "r-machine/locale";
import { defaultCookieDeclaration } from "r-machine/strategy/web";
import { rMachine, strategy } from "./r-machine";

// ---- TEMP
// biome-ignore lint/suspicious/noConfusingVoidType: Use exact type definition from Next.js
type NextProxyResult = NextResponse | Response | null | undefined | void;
const strategyConfig: NextAppPathStrategyConfig<string> = (strategy as any).config;
// ---- TEMP

const standardNextProxyMatcherRegExp: RegExp = /^\/(?!(?:_next|_vercel|api)(?:\/|$)|.*\.[^/]+$)/; // Standard Next.js proxy matching

const default_autoDetectLocale_pathMatcherRegExp_implicit: RegExp | null = /^\/$/; // Auto detect only root path
const default_autoDetectLocale_pathMatcherRegExp_explicit: RegExp | null = standardNextProxyMatcherRegExp; // Auto detect all paths
const default_implicitDefaultLocale_pathMatcherRegExp: RegExp | null = standardNextProxyMatcherRegExp; // Implicit for all paths

export function createProxy() {
  const locales = rMachine.config.locales;
  const defaultLocale = rMachine.config.defaultLocale;

  const { autoLocaleBinding, basePath, cookie, lowercaseLocale, autoDetectLocale, implicitDefaultLocale } =
    strategyConfig;

  const autoLBSw = autoLocaleBinding === "on";

  const cookieSw = cookie !== "off";
  const { name: cookieName, ...cookieOptions } = cookieSw ? (cookie === "on" ? defaultCookieDeclaration : cookie) : {};

  const lowercaseLocaleSw = lowercaseLocale === "on";

  const implicitSw = implicitDefaultLocale !== "off";
  const implicitRegExp: RegExp | null =
    implicitDefaultLocale instanceof RegExp
      ? implicitDefaultLocale
      : implicitDefaultLocale === "on"
        ? default_implicitDefaultLocale_pathMatcherRegExp
        : null;

  const autoDLSw = autoDetectLocale !== "off";
  const autoDLRegExp: RegExp | null =
    autoDetectLocale instanceof RegExp
      ? autoDetectLocale
      : autoDetectLocale === "on"
        ? implicitSw
          ? default_autoDetectLocale_pathMatcherRegExp_implicit
          : default_autoDetectLocale_pathMatcherRegExp_explicit
        : null;

  // Need two regexes to handle basePath correctly
  // Use case-insensitive matching for locale codes
  const inLocaleRegex = new RegExp(`^\\/(${locales.join("|")})(?:\\/|$)`, "i");
  const outLocaleRegex = new RegExp(`^${basePath}\\/(${locales.join("|")})(?:\\/|$)`, "i");

  function getExplicitLocalePathName(locale: string, pathName: string): string {
    return `${basePath}/${lowercaseLocaleSw ? locale.toLowerCase() : locale}${pathName}`;
  }

  function getLocaleFromCookie(request: NextRequest): string | undefined {
    if (!cookieSw) {
      return undefined;
    }

    const localeCookie = request.cookies.get(cookieName!)?.value;
    if (localeCookie === undefined) {
      return undefined;
    }

    if (!locales.includes(localeCookie)) {
      return undefined;
    }

    return localeCookie;
  }

  function proxy(request: NextRequest): NextProxyResult {
    const pathname = request.nextUrl.pathname;
    const match = pathname.match(inLocaleRegex);

    if (match) {
      // Locale is present in the URL
      const providedLocale = match[1];
      const locale = getCanonicalUnicodeLocaleId(providedLocale);

      if (implicitSw && locale === defaultLocale) {
        // Locale is present but canonical URL is implicit (no locale prefix)
        const implicitPath = pathname.replace(outLocaleRegex, "/");
        const response = NextResponse.redirect(new URL(implicitPath, request.url));
        if (cookieSw) {
          const localeCookie = getLocaleFromCookie(request);
          if (localeCookie !== locale) {
            // Set locale cookie
            response.cookies.set(cookieName!, locale, cookieOptions);
          }
        }
        return response;
      }

      // Standard locale-prefixed URL
      if (autoLBSw) {
        // Bind locale to request headers
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(localeHeaderName, locale);

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }

      // No locale binding needed
      return NextResponse.next();
    }

    // Locale is not present in the URL
    if (implicitSw) {
      // Use implicit URLs

      if (implicitRegExp === null || implicitRegExp.test(pathname)) {
        // Valid implicit URL
        let locale: string;
        if (autoDLSw && (autoDLRegExp === null || autoDLRegExp.test(pathname))) {
          // Is auto-detect URL
          const localeCookie = getLocaleFromCookie(request);

          if (localeCookie !== undefined) {
            // Cookie enabled and available, use locale from cookie
            locale = localeCookie;
          } else {
            // Cookie disabled - OR - First time visiting, auto-detect from Accept-Language header
            locale = rMachine.localeHelper.matchLocalesForAcceptLanguageHeader(request.headers.get("accept-language"));
          }

          if (locale !== defaultLocale) {
            // Redirect to the URL with the locale prefix
            return NextResponse.redirect(new URL(getExplicitLocalePathName(locale, pathname), request.url));
          }
        } else {
          // Non auto-detect URL, always use default locale
          locale = defaultLocale;
        }

        // Rewrite to locale-prefixed URL internally
        const newUrl = request.nextUrl.clone();
        newUrl.pathname = getExplicitLocalePathName(locale, pathname);

        if (autoLBSw) {
          // Bind locale to request headers
          const requestHeaders = new Headers(request.headers);
          requestHeaders.set(localeHeaderName, locale);
          return NextResponse.rewrite(newUrl, {
            request: {
              headers: requestHeaders,
            },
          });
        }

        // No locale binding needed
        return NextResponse.rewrite(newUrl);
      }

      // Invalid implicit URL, do not proxy - irrelevant for locale strategy
      return NextResponse.next();
    }

    // Do not use implicit URLs
    if (autoDLSw && (autoDLRegExp === null || autoDLRegExp.test(pathname))) {
      // Is auto-detect URL
      const localeCookie = getLocaleFromCookie(request);

      let locale: string;
      if (localeCookie !== undefined) {
        // Cookie enabled and available, use locale from cookie
        locale = localeCookie;
      } else {
        // Cookie disabled - OR - First time visiting, auto-detect from Accept-Language header
        locale = rMachine.localeHelper.matchLocalesForAcceptLanguageHeader(request.headers.get("accept-language"));
      }

      // Redirect to the URL with the locale prefix
      return NextResponse.redirect(new URL(getExplicitLocalePathName(locale, pathname), request.url));
    }

    // NOot an auto-detect URL
    // Irrelevant URL, do not proxy
    return NextResponse.next();
  }

  return proxy;
}
