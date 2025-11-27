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

type GetHRef = (path: string) => string;

export interface NextAppServerPathToolset<A extends AnyAtlas, LK extends string> extends NextAppServerToolset<A, LK> {
  readonly NextServerRMachine: NextAppServerPathRMachine;
  readonly getHref: GetHRef;
}

export interface NextAppServerPathRMachine extends NextAppServerRMachine {
  readonly EntrancePage: EntrancePage;
}

export type EntrancePage = () => Promise<ReactNode>;

export type NextAppServerPathImpl<LK extends string> = NextAppServerImpl<LK> & {
  readonly createEntrancePage:
    | ((
        cookies: CookiesFn,
        headers: HeadersFn,
        setLocale: (newLocale: string) => Promise<void>
      ) => EntrancePage | Promise<EntrancePage>)
    | undefined;
  readonly getHref: GetHRef;
};

export async function createNextAppServerPathToolset<A extends AnyAtlas, LK extends string>(
  rMachine: RMachine<A>,
  impl: NextAppServerPathImpl<LK>,
  NextClientRMachine: NextClientRMachine
): Promise<NextAppServerPathToolset<A, LK>> {
  const baseToolset = await createNextAppServerToolset<A, LK>(rMachine, impl, NextClientRMachine);
  (baseToolset.NextServerRMachine as any).EntrancePage = impl.createEntrancePage;
  const getHref = impl.getHref;

  return {
    ...baseToolset,
    NextServerRMachine: baseToolset.NextServerRMachine as NextAppServerPathRMachine,
    getHref,
  };
}
