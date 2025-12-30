import type { AnyAtlas, RMachine } from "r-machine";
import type { ReactNode } from "react";
import type { NextClientRMachine, PathAtlas } from "#r-machine/next/core";
import type { CookiesFn, HeadersFn } from "#r-machine/next/internal";
import {
  createNextAppServerToolset,
  type NextAppServerImpl,
  type NextAppServerRMachine,
  type NextAppServerToolset,
} from "./next-app-server-toolset.js";
import type { NextAppStandaloneStrategyCoreConfig } from "./next-app-standalone-strategy-core.js";

export interface NextAppStandaloneServerToolset<A extends AnyAtlas, PA extends PathAtlas, LK extends string>
  extends NextAppServerToolset<A, PA, LK> {
  readonly NextServerRMachine: NextAppStandaloneServerRMachine;
}

export interface NextAppStandaloneServerRMachine extends NextAppServerRMachine {
  readonly EntrancePage: EntrancePage;
}
type EntrancePage = () => Promise<ReactNode>;

export interface NextAppStandaloneServerImpl<PA extends PathAtlas> extends NextAppServerImpl<PA> {
  readonly createEntrancePage: (
    cookies: CookiesFn,
    headers: HeadersFn,
    setLocale: (newLocale: string) => Promise<void>
  ) => EntrancePage | Promise<EntrancePage>;
}

export async function createNextAppStandaloneServerToolset<A extends AnyAtlas, PA extends PathAtlas, LK extends string>(
  rMachine: RMachine<A>,
  config: NextAppStandaloneStrategyCoreConfig<PA, LK>,
  impl: NextAppStandaloneServerImpl<PA>,
  NextClientRMachine: NextClientRMachine
): Promise<NextAppStandaloneServerToolset<A, PA, LK>> {
  const { NextServerRMachine, setLocale, ...otherTools } = await createNextAppServerToolset<A, PA, LK>(
    rMachine,
    config,
    impl,
    NextClientRMachine
  );

  // Use dynamic import to bypass the "next/headers" import issue in pages/ directory
  // You're importing a component that needs "next/headers". That only works in a Server Component which is not supported in the pages/ directory. Read more: https://nextjs.org/docs/app/building-your-application/rendering/server-components
  const { cookies, headers } = await import("next/headers");

  (NextServerRMachine as any).EntrancePage = await impl.createEntrancePage(cookies, headers, setLocale);

  return {
    ...otherTools,
    NextServerRMachine: NextServerRMachine as NextAppStandaloneServerRMachine,
    setLocale,
  };
}
