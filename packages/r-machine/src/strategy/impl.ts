import type { AnyAtlas, RMachine } from "#r-machine";

export interface AnyImpl {
  readonly [key: string]: any;
}

export type ImplFactory<I extends AnyImpl, C> = (rMachine: RMachine<AnyAtlas>, strategyConfig: C) => Promise<I>;

export type ImplProvider<I extends AnyImpl, C> = I | ImplFactory<I, C>;

export function getImplFactory<I extends AnyImpl, C = undefined>(impl: ImplProvider<I, C>): ImplFactory<I, C> {
  if (typeof impl === "function") {
    return impl;
  }
  return (async () => impl) as ImplFactory<I, C>;
}
