"use client";

import type { AnyAtlas, RMachine } from "r-machine";
import {
  createNextClientToolsetEnvelope,
  type NextClientImpl,
  type NextClientToolset,
  type NextClientToolsetEnvelope,
} from "./next-client-toolset.js";
import type { BoundPathComposer } from "./next-path-strategy-core.js";

export type NextPathClientToolset<A extends AnyAtlas> = NextClientToolset<A> & {
  readonly usePathComposer: () => BoundPathComposer;
};
export interface NextPathClientToolsetEnvelope<A extends AnyAtlas> extends NextClientToolsetEnvelope<A> {
  readonly toolset: NextPathClientToolset<A>;
}

export interface NextPathClientImpl extends NextClientImpl {
  createUsePathComposer: (useLocale: () => string) => () => BoundPathComposer;
}

export async function createNextPathClientToolsetEnvelope<A extends AnyAtlas>(
  rMachine: RMachine<A>,
  impl: NextPathClientImpl
): Promise<NextPathClientToolsetEnvelope<A>> {
  const envelope = await createNextClientToolsetEnvelope(rMachine, impl);

  const usePathComposer = impl.createUsePathComposer(envelope.toolset.useLocale);

  const toolset = {
    ...envelope.toolset,
    usePathComposer,
  };
  return {
    NextClientRMachine: envelope.NextClientRMachine,
    toolset,
  };
}
