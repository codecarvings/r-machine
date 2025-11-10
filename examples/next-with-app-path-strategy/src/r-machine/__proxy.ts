import type { NextAppPathStrategyConfig } from "@r-machine/next/app";
import { localeHeaderName } from "@r-machine/next/core/app";
import { type NextRequest, NextResponse } from "next/server";
import { getCanonicalUnicodeLocaleId } from "r-machine/locale";
import { rMachine, strategy } from "./r-machine";

// biome-ignore lint/suspicious/noConfusingVoidType: Use exact type definition from Next.js
type NextProxyResult = NextResponse | Response | null | undefined | void;
const strategyConfig: NextAppPathStrategyConfig<string> = (strategy as any).config;

export interface CookieDeclaration {
  readonly name: string;
  readonly path?: string | undefined;
  readonly httpOnly?: boolean | undefined;
  readonly secure?: boolean | undefined;
  readonly sameSite?: "lax" | "strict" | "none" | undefined;
  readonly maxAge?: number | undefined;
  readonly domain?: string | undefined;
}

export function createProxy() {
  const locales = rMachine.config.locales;
  const pathLocales = strategyConfig.lowercaseLocale ? locales.map((locale) => locale.toLowerCase()) : locales;
  const defaultLocale = rMachine.config.defaultLocale;
  const { lowercaseLocale, implicitDefaultLocale, autoDetectLocale, allowAutoLocaleBinding, basePath, cookie } =
    strategyConfig;

  const implicitSw = implicitDefaultLocale !== "off";
  const implicitRegExp: RegExp | null = implicitDefaultLocale instanceof RegExp ? implicitDefaultLocale : null;

  const autoSw = autoDetectLocale !== "off";
  const autoRegExp: RegExp | null = autoDetectLocale instanceof RegExp ? autoDetectLocale : null;

  const cookieSw = cookie !== "off";
  const { name: cookieName } = cookieSw ? cookie : {};

  const inLocalePattern = `^\\/(${pathLocales.join("|")})(?:\\/|$)`;
  const inLocaleRegex = new RegExp(inLocalePattern);

  const outLocalePattern = `^${basePath}\\/(${pathLocales.join("|")})(?:\\/|$)`;
  const outLocaleRegex = new RegExp(outLocalePattern);

  function proxy(request: NextRequest): NextProxyResult {
    const pathname = request.nextUrl.pathname;
    console.log("rMachineProxy pathname:", pathname);
    const match = pathname.match(inLocaleRegex);

    const localeCookie = cookieSw ? request.cookies.get(cookieName!)?.value : undefined;
    const isValidLocaleCookie = localeCookie !== undefined && locales.includes(localeCookie);

    let locale: string;
    let rewrittenPathname: string | undefined;

    if (match) {
      // Locale is present in the URL
      locale = match[1];
      if (lowercaseLocale) {
        locale = getCanonicalUnicodeLocaleId(locale);
        if (locale !== getCanonicalUnicodeLocaleId(locale)) {
          // Only rewrite if casing is incorrect
          rewrittenPathname = pathname.replace(outLocaleRegex, `/${locale}/`);
        }
      }
      if (locale === defaultLocale && implicitSw) {
        // Locale is present but canonical URL is implicit (no locale prefix)
        const implicitPath = pathname.replace(outLocaleRegex, "/");
        console.log("Redirecting to implicitPath:", implicitPath);
        return NextResponse.redirect(new URL(implicitPath, request.url));
      }
    } else {
      // Locale is not present in the URL
      if (implicitSw) {
        if (implicitRegExp === null || implicitRegExp.test(pathname)) {
          // Valid implicit URL
          if (autoSw && (autoRegExp === null || autoRegExp.test(pathname))) {
            // Is auto-detect URL
            if (localeCookie !== undefined) {
              // Cookie available, use locale from cookie
              locale = localeCookie;
            } else {
              // First time visiting, auto-detect from Accept-Language header
              locale = rMachine.localeHelper.matchLocalesForAcceptLanguageHeader(
                request.headers.get("accept-language")
              );

              if (locale !== defaultLocale) {
                // Redirect to the URL with the locale prefix
                const redirectPathname = `/${lowercaseLocale ? locale.toLowerCase() : locale}${pathname}`;
                return NextResponse.redirect(new URL(redirectPathname, request.url));
              }
            }
          } else {
            // Non auto-detect URL, always use default locale
            locale = defaultLocale;
          }

          // Rewrite to locale-prefixed URL internally
          rewrittenPathname = `/${locale}${pathname}`;
        } else {
          // Irrelevant URL, do not proxy
          return NextResponse.next();
        }
      } else {
        // Do not use implicit URLs, redirect to locale-prefixed URL
        if (autoSw && (autoRegExp === null || autoRegExp.test(pathname))) {
          // Is auto-detect URL
          if (isValidLocaleCookie) {
            locale = localeCookie;
          } else {
            locale = rMachine.localeHelper.matchLocalesForAcceptLanguageHeader(request.headers.get("accept-language"));
          }

          // Redirect to the URL with the locale prefix
          const redirectPathname = `/${lowercaseLocale ? locale.toLowerCase() : locale}${pathname}`;
          return NextResponse.redirect(new URL(redirectPathname, request.url));
        } else {
          // Irrelevant URL, do not proxy
          return NextResponse.next();
        }
      }
    }

    if (rewrittenPathname !== undefined) {
      // Need to rewrite the URL
      const rewrittenUrl = request.nextUrl.clone();
      rewrittenUrl.pathname = rewrittenPathname;

      if (allowAutoLocaleBinding) {
        // Bind locale to request headers
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(localeHeaderName, locale);
        return NextResponse.rewrite(rewrittenUrl, {
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        // No locale binding needed
        return NextResponse.rewrite(rewrittenUrl);
      }
    } else {
      // No rewrite needed
      if (allowAutoLocaleBinding) {
        // Bind locale to request headers
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(localeHeaderName, locale);

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        // No locale binding needed - Nothing to do
      }
    }
  }

  return proxy;
}
