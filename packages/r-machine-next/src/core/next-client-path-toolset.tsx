"use client";

import type { AnyAtlas, RMachine } from "r-machine";
import { createNextClientToolset, type NextClientImpl, type NextClientToolset } from "./next-client-toolset.js";

type GetHRef = (path: string) => string;

export type NextClientPathToolset<A extends AnyAtlas> = NextClientToolset<A> & {
  readonly getHref: GetHRef;
};

export type NextClientPathImpl = NextClientImpl & {
  readonly getHref: GetHRef;
};

export async function createNextClientPathToolset<A extends AnyAtlas>(
  rMachine: RMachine<A>,
  impl: NextClientPathImpl
): Promise<NextClientPathToolset<A>> {
  const baseToolset = await createNextClientToolset(rMachine, impl);
  const getHref = impl.getHref;

  return {
    ...baseToolset,
    getHref,
  };
}
