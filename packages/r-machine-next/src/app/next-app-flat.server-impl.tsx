import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import type { ImplFactory } from "r-machine/strategy";
import { type AnyNextAppFlatStrategyConfig, localeHeaderName, type NextAppServerImpl } from "#r-machine/next/core/app";
import type { CookiesFn, NextProxyResult } from "#r-machine/next/internal";

export const createNextAppFlatServerImpl: ImplFactory<NextAppServerImpl, AnyNextAppFlatStrategyConfig> = async (
  rMachine,
  strategyConfig
) => {
  const locales = rMachine.config.locales;
  const { localeKey, autoLocaleBinding, cookie, pathMatcher } = strategyConfig;
  const autoLBSw = autoLocaleBinding === "on";
  const { name: cookieName, ...cookieConfig } = cookie;

  return {
    localeKey,
    autoLocaleBinding: autoLBSw,

    async writeLocale(newLocale, cookies: CookiesFn) {
      try {
        const cookieStore = await cookies();
        cookieStore.set(cookieName!, newLocale, cookieConfig);
      } catch {
        // SetLocale not invoked in a Server Action or Route Handler.
      }

      // TODO: Find a way to force a reload
      redirect("/");
    },

    createLocaleStaticParamsGenerator() {
      return async () =>
        rMachine.config.locales.map((locale: string) => ({
          [localeKey]: locale,
        }));
    },

    createProxy() {
      function getLocaleFromCookie(request: NextRequest): string | undefined {
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

        if (pathMatcher === null || pathMatcher.test(pathname)) {
          // Is an handled path
          const cookieLocale = getLocaleFromCookie(request);

          let locale: string;
          if (cookieLocale !== undefined) {
            // Cookie available, use locale from cookie
            locale = cookieLocale;
          } else {
            // First time visiting, auto-detect from Accept-Language header
            locale = rMachine.localeHelper.matchLocalesForAcceptLanguageHeader(request.headers.get("accept-language"));
          }

          // Rewrite to locale-prefixed URL internally - basePath already included
          const newUrl = request.nextUrl.clone();
          newUrl.pathname = `/${locale}${pathname}`;

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

        // Irrelevant URL, do not proxy
        return NextResponse.next();
      }

      return proxy;
    },
  };
};
