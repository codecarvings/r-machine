import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import type { ImplFactory } from "r-machine/strategy";
import { type EntrancePageProps, localeHeaderName, type NextAppServerImpl } from "#r-machine/next/core/app";
import { NextAppEntrancePage } from "./next-app-entrance-page.js";
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

  createProxy() {
    const proxy = (request: NextRequest) => {
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
    };
    proxy.chain = undefined!;
    return proxy;
  },

  createEntrancePage(setLocale) {
    async function EntrancePage({ locale }: EntrancePageProps) {
      // Workaround for typescript error:
      // NextAppEntrancePage' cannot be used as a JSX component. Its return type 'Promise<void>' is not a valid JSX element.
      return (
        <>
          {/* @ts-expect-error Async Server Component */}
          <NextAppEntrancePage rMachine={rMachine} locale={locale ?? undefined} setLocale={setLocale} />
        </>
      );
    }

    return EntrancePage;
  },
});
