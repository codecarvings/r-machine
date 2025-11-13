import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import type { ImplFactory } from "r-machine/strategy";
import { type EntrancePageProps, localeHeaderName, type NextAppServerImpl } from "#r-machine/next/core/app";
import type { NextProxyResult } from "#r-machine/next/internal";
import type { NextAppPathStrategyConfig } from "./next-app-path-strategy.js";

export const nextAppPathImpl_serverFactory: ImplFactory<NextAppServerImpl, NextAppPathStrategyConfig<string>> = async (
  rMachine,
  strategyConfig
) => ({
  writeLocale(newLocale) {
    const locale = strategyConfig.lowercaseLocale ? newLocale.toLowerCase() : newLocale;
    const path = `/${locale}`;

    redirect(path);
  },

  createLocaleStaticParamsGenerator() {
    return async () =>
      rMachine.config.locales.map((locale: string) => ({
        [strategyConfig.localeKey]: strategyConfig.lowercaseLocale ? locale.toLowerCase() : locale,
      }));
  },

  createProxy() {
    function proxy(request: NextRequest): NextProxyResult {
      const pathname = request.nextUrl.pathname;
      console.log("rMachineProxy pathname:", pathname);

      const locale = "en";
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set(localeHeaderName, locale);
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    return proxy;
  },

  createEntrancePage(headers, setLocale) {
    async function EntrancePage({ locale }: EntrancePageProps) {
      if (locale) {
        await setLocale(locale);
      } else {
        const headersList = await headers();
        const acceptLanguageHeader = headersList.get("accept-language");
        const defaultLocale = rMachine.localeHelper.matchLocalesForAcceptLanguageHeader(acceptLanguageHeader);
        await setLocale(defaultLocale);
      }

      return null;
    }

    return EntrancePage;
  },
});
