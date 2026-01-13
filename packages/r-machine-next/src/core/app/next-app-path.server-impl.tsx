import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import type { AnyAtlas, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { getCanonicalUnicodeLocaleId } from "r-machine/locale";
import { defaultCookieDeclaration } from "r-machine/strategy/web";
import type { HrefResolver } from "#r-machine/next/core";
import {
  type AnyNextAppPathStrategyConfig,
  localeHeaderName,
  type NextAppNoProxyServerImpl,
} from "#r-machine/next/core/app";
import {
  type CookiesFn,
  defaultPathMatcher,
  type NextProxyResult,
  validateServerOnlyUsage,
} from "#r-machine/next/internal";

const default_autoDL_matcher_implicit: RegExp | null = /^\/$/; // Auto detect only root path
const default_autoDL_matcher_explicit: RegExp | null = defaultPathMatcher; // Auto detect all standard next paths
const default_implicit_matcher: RegExp | null = defaultPathMatcher; // Implicit for all standard paths

const pathComposerNormalizerRegExp = /^\//;

export async function createNextAppPathServerImpl(
  rMachine: RMachine<AnyAtlas>,
  strategyConfig: AnyNextAppPathStrategyConfig,
  _resolveHref: HrefResolver
) {
  const locales = rMachine.config.locales;
  const defaultLocale = rMachine.config.defaultLocale;
  const { localeKey, autoLocaleBinding, basePath, cookie, lowercaseLocale, autoDetectLocale, implicitDefaultLocale } =
    strategyConfig;
  const autoLBSw = autoLocaleBinding === "on";
  const lowercaseLocaleSw = lowercaseLocale === "on";
  const implicitSw = implicitDefaultLocale !== "off";
  const autoDLSw = autoDetectLocale !== "off";
  const cookieSw = cookie !== "off";
  const { name: cookieName, ...cookieConfig } = cookieSw ? (cookie === "on" ? defaultCookieDeclaration : cookie) : {};

  return {
    localeKey,
    autoLocaleBinding: autoLBSw,

    async writeLocale(newLocale, cookies: CookiesFn) {
      if (cookieSw) {
        try {
          const cookieStore = await cookies();
          // 3) Set cookie on write (required when implicitDefaultLocale is on - problem with double redirect on explicit path)
          cookieStore.set(cookieName!, newLocale, cookieConfig);
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

      function getLocaleFromCookie(request: NextRequest): string | undefined {
        if (!cookieSw) {
          return undefined;
        }

        const cookieLocale = request.cookies.get(cookieName!)?.value;
        if (cookieLocale === undefined) {
          return undefined;
        }

        if (!locales.includes(cookieLocale)) {
          return undefined;
        }

        return cookieLocale;
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
              const cookieLocale = getLocaleFromCookie(request);
              if (cookieLocale !== locale) {
                // 4) Set cookie on redirect (required when implicitDefaultLocale is on and switching to default locale)
                response.cookies.set(cookieName!, locale, cookieConfig);
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
              const cookieLocale = getLocaleFromCookie(request);

              if (cookieLocale !== undefined) {
                // Cookie enabled and available, use locale from cookie
                locale = cookieLocale;
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

          // Not an implicit URL, do not proxy - irrelevant for locale strategy
          return NextResponse.next();
        }

        // Do not use implicit URLs
        if (autoDLSw && (autoDLRegExp === null || autoDLRegExp.test(pathname))) {
          // Is auto-detect URL
          const cookieLocale = getLocaleFromCookie(request);

          let locale: string;
          if (cookieLocale !== undefined) {
            // Cookie enabled and available, use locale from cookie
            locale = cookieLocale;
          } else {
            // Cookie disabled - OR - First time visiting, auto-detect from Accept-Language header
            locale = rMachine.localeHelper.matchLocalesForAcceptLanguageHeader(request.headers.get("accept-language"));
          }

          // Redirect to the URL with the locale prefix
          return NextResponse.redirect(
            new URL(`${basePath}/${lowercaseLocaleSw ? locale.toLowerCase() : locale}${pathname}`, request.url)
          );
        }

        // Not an auto-detect URL
        // Irrelevant URL, do not proxy
        return NextResponse.next();
      }

      return proxy;
    },

    createEntrancePage(cookies, headers, setLocale) {
      async function getLocaleFromCookie(): Promise<string | undefined> {
        if (!cookieSw) {
          return undefined;
        }

        const cookieStore = await cookies();
        const cookieLocale = cookieStore.get(cookieName!)?.value;
        if (cookieLocale === undefined) {
          return undefined;
        }

        if (!locales.includes(cookieLocale)) {
          return undefined;
        }

        return cookieLocale;
      }

      function throwRequiredProxyError(details: string): never {
        throw new RMachineError(
          `EntrancePage is not available when some option requires the use of the proxy (${details}).`
        );
      }

      async function EntrancePage() {
        validateServerOnlyUsage("EntrancePage");

        if (implicitSw) {
          throwRequiredProxyError("implicitDefaultLocale is on");
        }
        if (autoLBSw) {
          throwRequiredProxyError("autoLocaleBinding is on");
        }

        const cookieLocale = await getLocaleFromCookie();
        if (cookieLocale !== undefined) {
          await setLocale(cookieLocale);
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

    createBoundPathComposerSupplier(getLocale) {
      async function getPathComposer() {
        validateServerOnlyUsage("getPathComposer");

        const locale = await getLocale();

        function getPath(path: string): string {
          let localeParam: string;
          if (implicitSw && locale === defaultLocale) {
            localeParam = "";
          } else {
            localeParam = `/${lowercaseLocaleSw ? locale.toLowerCase() : locale}`;
          }
          return `${localeParam}/${path.replace(pathComposerNormalizerRegExp, "")}`;
        }

        return getPath;
      }

      return getPathComposer;
    },
  } as NextAppNoProxyServerImpl;
}
