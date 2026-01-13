import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { ReactNode } from "react";
import type { AnyPathAtlas, NextClientRMachine } from "#r-machine/next/core";
import type { CookiesFn, HeadersFn } from "#r-machine/next/internal";
import {
  createNextAppServerToolset,
  type NextAppServerImpl,
  type NextAppServerToolset,
} from "./next-app-server-toolset.js";

export interface NextAppNoProxyServerToolset<RA extends AnyResourceAtlas, PA extends AnyPathAtlas, LK extends string>
  extends Omit<NextAppServerToolset<RA, PA, LK>, "rMachineProxy"> {
  readonly EntrancePage: EntrancePage;
}

type EntrancePage = () => Promise<ReactNode>;

export interface NextAppNoProxyServerImpl extends NextAppServerImpl {
  readonly createEntrancePage: (
    cookies: CookiesFn,
    headers: HeadersFn,
    setLocale: (newLocale: string) => Promise<void>
  ) => EntrancePage | Promise<EntrancePage>;
}

export async function createNextAppNoProxyServerToolset<
  RA extends AnyResourceAtlas,
  PA extends AnyPathAtlas,
  LK extends string,
>(
  rMachine: RMachine<RA>,
  impl: NextAppNoProxyServerImpl,
  NextClientRMachine: NextClientRMachine
): Promise<NextAppNoProxyServerToolset<RA, PA, LK>> {
  const {
    rMachineProxy: _rMachineProxy,
    setLocale,
    ...otherTools
  } = await createNextAppServerToolset<RA, PA, LK>(rMachine, impl, NextClientRMachine);

  // Use dynamic import to bypass the "next/headers" import issue in pages/ directory
  // You're importing a component that needs "next/headers". That only works in a Server Component which is not supported in the pages/ directory. Read more: https://nextjs.org/docs/app/building-your-application/rendering/server-components
  const { cookies, headers } = await import("next/headers");

  const EntrancePage = await impl.createEntrancePage(cookies, headers, setLocale);

  return {
    ...otherTools,
    setLocale,
    EntrancePage,
  };
}
