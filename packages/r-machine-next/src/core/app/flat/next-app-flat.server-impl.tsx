import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import { type NextProxyResult, validateServerOnlyUsage } from "#r-machine/next/internal";
import type { NextAppServerImpl } from "../next-app-server-toolset.js";
import { localeHeaderName } from "../next-app-strategy-core.js";
import type { AnyNextAppFlatStrategyConfig } from "./next-app-flat-strategy-core.js";

const scPathHeaderName = "x-rm-scpath"; // Static Canonical Path

export async function createNextAppFlatServerImpl(
  rMachine: RMachine<AnyResourceAtlas>,
  strategyConfig: AnyNextAppFlatStrategyConfig,
  pathTranslator: HrefTranslator,
  pathCanonicalizer: HrefCanonicalizer
) {
  const locales = rMachine.config.locales;
  const { localeKey, autoLocaleBinding, cookie, pathMatcher } = strategyConfig;
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
