import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import type { ImplFactory } from "r-machine/strategy";
import { type EntrancePageProps, localeHeaderName, type NextAppServerImplComplement } from "#r-machine/next/core/app";
import type { NextProxyResult } from "#r-machine/next/internal";
import type { NextAppPathStrategyConfig } from "./next-app-path-strategy.js";

export const createNextAppPathServerImplComplement: ImplFactory<
  NextAppServerImplComplement<string>,
  NextAppPathStrategyConfig<string>
> = async (rMachine, strategyConfig) => {
  const { basePath } = strategyConfig;
  const lowercaseLocale = strategyConfig.lowercaseLocale === "on";
  // Do not consider implicitDefaultLocale since when writing locale we always write explicit locale (to set cookie)

  return {
    writeLocale(newLocale) {
      const locale = lowercaseLocale ? newLocale.toLowerCase() : newLocale;
      const path = `${basePath}/${locale}`;

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
          const detectedLocale = rMachine.localeHelper.matchLocalesForAcceptLanguageHeader(acceptLanguageHeader);
          await setLocale(detectedLocale);
        }

        return null;
      }

      return EntrancePage;
    },
  };
};
