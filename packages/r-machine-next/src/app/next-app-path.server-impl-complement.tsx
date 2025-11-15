import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import { RMachineError } from "r-machine/errors";
import { getCanonicalUnicodeLocaleId } from "r-machine/locale";
import type { ImplFactory } from "r-machine/strategy";
import { defaultCookieDeclaration } from "r-machine/strategy/web";
import { type EntrancePageProps, localeHeaderName, type NextAppServerImplComplement } from "#r-machine/next/core/app";
import type { CookiesFn, NextProxyResult } from "#r-machine/next/internal";
import type { NextAppPathStrategyConfig } from "./next-app-path-strategy.js";

const standardNextProxyMatcherRegExp: RegExp = /^\/(?!(?:_next|_vercel|api)(?:\/|$)|.*\.[^/]+$)/; // Standard Next.js proxy matching

const default_autoDetectLocale_pathMatcherRegExp_implicit: RegExp | null = /^\/$/; // Auto detect only root path
const default_autoDetectLocale_pathMatcherRegExp_explicit: RegExp | null = standardNextProxyMatcherRegExp; // Auto detect all paths
const default_implicitDefaultLocale_pathMatcherRegExp: RegExp | null = standardNextProxyMatcherRegExp; // Implicit for all paths

export const createNextAppPathServerImplComplement: ImplFactory<
  NextAppServerImplComplement<string>,
  NextAppPathStrategyConfig<string>
> = async (rMachine, strategyConfig) => {
  const locales = rMachine.config.locales;
  const defaultLocale = rMachine.config.defaultLocale;

  const { localeKey, autoLocaleBinding, basePath, cookie, lowercaseLocale, autoDetectLocale, implicitDefaultLocale } =
    strategyConfig;

  const autoLBSw = autoLocaleBinding === "on";
  const lowercaseLocaleSw = lowercaseLocale === "on";
  const implicitSw = implicitDefaultLocale !== "off";
  const autoDLSw = autoDetectLocale !== "off";

  const cookieSw = cookie !== "off";
  const { name: cookieName, ...cookieOptions } = cookieSw ? (cookie === "on" ? defaultCookieDeclaration : cookie) : {};

  return {
    async writeLocale(newLocale, cookies: CookiesFn) {
      if (cookieSw) {
        try {
          const cookieStore = await cookies();
          // 3) Set cookie on write (required when implicitDefaultLocale is on - problem with double redirect on explicit path)
          cookieStore.set(cookieName!, newLocale, cookieOptions);
        } catch {
          // SetLocale not invoked in a Server Action or Route Handler.
        }
      }

      let localeParam: string;
      if (implicitSw && newLocale === defaultLocale) {
        localeParam = "";
      } else {
        localeParam = lowercaseLocaleSw ? newLocale.toLowerCase() : newLocale;
      }
      const path = `/${localeParam}`;
      redirect(path);
    },

    createLocaleStaticParamsGenerator() {
      return async () =>
        rMachine.config.locales.map((locale: string) => ({
          [localeKey]: lowercaseLocaleSw ? locale.toLowerCase() : locale,
        }));
    },

    createProxy() {
      const implicitRegExp: RegExp | null =
        implicitDefaultLocale instanceof RegExp
          ? implicitDefaultLocale
          : implicitDefaultLocale === "on"
            ? default_implicitDefaultLocale_pathMatcherRegExp
            : null;

      const autoDLRegExp: RegExp | null =
        autoDetectLocale instanceof RegExp
          ? autoDetectLocale
          : autoDetectLocale === "on"
            ? implicitSw
              ? default_autoDetectLocale_pathMatcherRegExp_implicit
              : default_autoDetectLocale_pathMatcherRegExp_explicit
            : null;

      // Use case-insensitive matching for locale codes
      const localeRegex = new RegExp(`^\\/(${locales.join("|")})(?:\\/|$)`, "i");

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
        const match = pathname.match(localeRegex);

        if (match) {
          // Locale is present in the URL
          const providedLocale = match[1];
          const locale = getCanonicalUnicodeLocaleId(providedLocale);

          if (implicitSw && locale === defaultLocale) {
            // Locale is present but canonical URL is implicit (no locale prefix)
            const implicitPath = pathname.replace(localeRegex, `${basePath}/`);
            const response = NextResponse.redirect(new URL(implicitPath, request.url));
            if (cookieSw) {
              const localeCookie = getLocaleFromCookie(request);
              if (localeCookie !== locale) {
                // 4) Set cookie on redirect (required when implicitDefaultLocale is on and switching to default locale)
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
                locale = rMachine.localeHelper.matchLocalesForAcceptLanguageHeader(
                  request.headers.get("accept-language")
                );
              }

              if (locale !== defaultLocale) {
                // Redirect to the URL with the locale prefix
                return NextResponse.redirect(
                  new URL(`${basePath}/${lowercaseLocaleSw ? locale.toLowerCase() : locale}${pathname}`, request.url)
                );
              }
            } else {
              // Non auto-detect URL, always use default locale
              locale = defaultLocale;
            }

            // Rewrite to locale-prefixed URL internally - basePath already included
            const newUrl = request.nextUrl.clone();
            newUrl.pathname = `/${lowercaseLocaleSw ? locale.toLowerCase() : locale}${pathname}`;

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
          return NextResponse.redirect(
            new URL(`${basePath}/${lowercaseLocaleSw ? locale.toLowerCase() : locale}${pathname}`, request.url)
          );
        }

        // NOot an auto-detect URL
        // Irrelevant URL, do not proxy
        return NextResponse.next();
      }

      return proxy;
    },

    createEntrancePage(headers, cookies, setLocale) {
      async function getLocaleFromCookie(): Promise<string | undefined> {
        if (!cookieSw) {
          return undefined;
        }

        const cookieStore = await cookies();
        const localeCookie = cookieStore.get(cookieName!)?.value;
        if (localeCookie === undefined) {
          return undefined;
        }

        if (!locales.includes(localeCookie)) {
          return undefined;
        }

        return localeCookie;
      }

      async function EntrancePage({ locale }: EntrancePageProps) {
        if (implicitSw) {
          throw new RMachineError(
            "EntrancePage is not available when implicitDefaultLocale is enabled in NextAppPathStrategy."
          );
        }
        if (autoLBSw) {
          throw new RMachineError(
            "EntrancePage is not available when autoDetectLocale is enabled in NextAppPathStrategy."
          );
        }

        if (locale !== undefined && locale !== null) {
          await setLocale(locale);
          return null;
        }

        const localeCookie = await getLocaleFromCookie();
        if (localeCookie !== undefined) {
          await setLocale(localeCookie);
          return null;
        }

        const headerStore = await headers();
        const acceptLanguageHeader = headerStore.get("accept-language");
        const detectedLocale = rMachine.localeHelper.matchLocalesForAcceptLanguageHeader(acceptLanguageHeader);
        await setLocale(detectedLocale);
        return null;
      }

      return EntrancePage;
    },
  };
};
