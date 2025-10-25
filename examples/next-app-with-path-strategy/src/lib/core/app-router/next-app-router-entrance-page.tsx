"use server";

import { headers } from "next/headers";
import type { AnyAtlas, RMachine } from "r-machine";

// Separate component to bypass the "next/headers" import issue in pages/ directory
// You're importing a component that needs "next/headers". That only works in a Server Component which is not supported in the pages/ directory. Read more: https://nextjs.org/docs/app/building-your-application/rendering/server-components
// NOTE: also the "user server" directive is needed here!
export async function NextAppRouterEntrancePage({
  rMachine,
  locale,
  setLocale,
}: {
  rMachine: RMachine<AnyAtlas>;
  locale: string | undefined;
  setLocale(locale: string): void;
}) {
  if (locale) {
    setLocale(locale);
  } else {
    const headersList = await headers();
    const acceptLanguageHeader = headersList.get("accept-language");
    const defaultLocale = rMachine.localeHelper.matchLocalesForAcceptLanguageHeader(acceptLanguageHeader);
    setLocale(defaultLocale);
  }
}
