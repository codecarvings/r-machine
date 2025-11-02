import type { RMachine } from "r-machine";

// Separate component to bypass the "next/headers" import issue in pages/ directory
// You're importing a component that needs "next/headers". That only works in a Server Component which is not supported in the pages/ directory. Read more: https://nextjs.org/docs/app/building-your-application/rendering/server-components
// NOTE: also the "user server" directive is needed here!
export async function getLocaleFromRMachineHeader(rMachine: RMachine<any>): Promise<string> {
  const { headers } = await import("next/headers");

  const headersList = await headers();
  const acceptLanguageHeader = headersList.get("accept-language");
  return rMachine.localeHelper.matchLocalesForAcceptLanguageHeader(acceptLanguageHeader);
}
