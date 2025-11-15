import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import type { ImplFactory } from "r-machine/strategy";
import { defaultCookieDeclaration } from "r-machine/strategy/web";
import { type EntrancePageProps, localeHeaderName, type NextAppServerImplComplement } from "#r-machine/next/core/app";
import type { CookiesFn, NextProxyResult } from "#r-machine/next/internal";
import type { NextAppPathStrategyConfig } from "./next-app-path-strategy.js";

export const createNextAppPathServerImplComplement: ImplFactory<
  NextAppServerImplComplement<string>,
  NextAppPathStrategyConfig<string>
> = async (rMachine, strategyConfig) => {
  const { cookie } = strategyConfig;
  const lowercaseLocale = strategyConfig.lowercaseLocale === "on";
  const implicitDefaultLocale = strategyConfig.implicitDefaultLocale !== "off";

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
      if (implicitDefaultLocale && newLocale === rMachine.config.defaultLocale) {
        localeParam = "";
      } else {
        localeParam = lowercaseLocale ? newLocale.toLowerCase() : newLocale;
      }
      const path = `/${localeParam}`;
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
          const headerStore = await headers();
          const acceptLanguageHeader = headerStore.get("accept-language");
          const detectedLocale = rMachine.localeHelper.matchLocalesForAcceptLanguageHeader(acceptLanguageHeader);
          await setLocale(detectedLocale);
        }

        return null;
      }

      return EntrancePage;
    },
  };
};
