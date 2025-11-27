import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import { RMachineError } from "r-machine/errors";
import type { ImplFactory } from "r-machine/strategy";
import { localeHeaderName, type NextAppServerImplComplement } from "#r-machine/next/core/app";
import type { CookiesFn, HeadersFn, NextProxyResult } from "#r-machine/next/internal";
import { getOriginResolver, type NextAppOriginStrategyConfig } from "./next-app-origin-strategy.js";

export const createNextAppOriginServerImplComplement: ImplFactory<
  NextAppServerImplComplement<string>,
  NextAppOriginStrategyConfig<string>
> = async (rMachine, strategyConfig) => {
  const defaultLocale = rMachine.config.defaultLocale;
  const { localeKey, autoLocaleBinding, localeOriginMap, pathMatcher } = strategyConfig;
  const autoLBSw = autoLocaleBinding === "on";

  const resolveOrigin = getOriginResolver(strategyConfig.localeOriginMap, rMachine);

  return {
    async writeLocale(newLocale, _cookies: CookiesFn, headers: HeadersFn) {
      const headerStore = await headers();
      const currentOrigin = headerStore.get("origin");
      const newOrigin = resolveOrigin(newLocale);
      if (newOrigin !== currentOrigin) {
        // Redirect only if the origin for the new locale is different
        // (bug in Next.js when redirecting to the same origin)
        redirect(newOrigin);
      }
    },

    createLocaleStaticParamsGenerator() {
      return async () =>
        rMachine.config.locales.map((locale: string) => ({
          [localeKey]: locale,
        }));
    },

    createProxy() {
      const originCacheMap = new Map<string, string>();
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
                  locale = mapLocale;
                  break;
                }
              } else {
                if (mapOrigin.includes(origin)) {
                  locale = mapLocale;
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

          // Rewrite to locale-prefixed URL internally - basePath already included
          const newUrl = request.nextUrl.clone();
          newUrl.pathname = `/${locale!}${pathname}`;

          if (autoLBSw) {
            // Bind locale to request headers
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set(localeHeaderName, locale!);
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

    createEntrancePage() {
      async function EntrancePage() {
        throw new RMachineError("EntrancePage is not available with NextAppOriginStrategy.");

        // biome-ignore lint/correctness/noUnreachable: This is required to satisfy the return type
        return null;
      }

      return EntrancePage;
    },
  };
};
