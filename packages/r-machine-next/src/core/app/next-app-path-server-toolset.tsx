import type { AnyAtlas, RMachine } from "r-machine";
import type { ReactNode } from "react";
import type { NextClientRMachine } from "#r-machine/next/core";
import type { CookiesFn, HeadersFn } from "#r-machine/next/internal";
import {
  createNextAppServerToolset,
  type NextAppServerImpl,
  type NextAppServerRMachine,
  type NextAppServerToolset,
} from "./next-app-server-toolset.js";

export interface NextAppPathServerToolset<A extends AnyAtlas, LK extends string> extends NextAppServerToolset<A, LK> {
  readonly NextServerRMachine: NextAppPathServerRMachine;
  readonly getPathComposer: BoundPathComposerSupplier;
}

type BoundPathComposerSupplier = () => Promise<(path: string) => string>;

export interface NextAppPathServerRMachine extends NextAppServerRMachine {
  readonly EntrancePage: EntrancePage;
}
type EntrancePage = () => Promise<ReactNode>;

export interface NextAppPathServerImpl<LK extends string> extends NextAppServerImpl<LK> {
  readonly createEntrancePage: (
    cookies: CookiesFn,
    headers: HeadersFn,
    setLocale: (newLocale: string) => Promise<void>
  ) => EntrancePage | Promise<EntrancePage>;

  readonly createBoundPathComposerSupplier: (
    getLocale: () => Promise<string>
  ) => BoundPathComposerSupplier | Promise<BoundPathComposerSupplier>;
}

export async function createNextAppPathServerToolset<A extends AnyAtlas, LK extends string>(
  rMachine: RMachine<A>,
  impl: NextAppPathServerImpl<LK>,
  NextClientRMachine: NextClientRMachine
): Promise<NextAppPathServerToolset<A, LK>> {
  const { NextServerRMachine, getLocale, setLocale, ...otherTools } = await createNextAppServerToolset<A, LK>(
    rMachine,
    impl,
    NextClientRMachine
  );

  // Use dynamic import to bypass the "next/headers" import issue in pages/ directory
  // You're importing a component that needs "next/headers". That only works in a Server Component which is not supported in the pages/ directory. Read more: https://nextjs.org/docs/app/building-your-application/rendering/server-components
  const { cookies, headers } = await import("next/headers");

  (NextServerRMachine as any).EntrancePage = await impl.createEntrancePage(cookies, headers, setLocale);
  const getPathComposer = await impl.createBoundPathComposerSupplier(getLocale);

  return {
    ...otherTools,
    NextServerRMachine: NextServerRMachine as NextAppPathServerRMachine,
    getPathComposer,
    getLocale,
    setLocale,
  };
}
