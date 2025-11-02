import type { AnyAtlas, RMachine } from "r-machine";
import type { ImplFactory } from "r-machine/strategy";
import { createNextClientToolset, type NextClientImpl, type NextClientToolset } from "./next-client-toolset.js";
import { NextStrategy } from "./next-strategy.js";

export abstract class NextClientImplProvider<C> extends NextStrategy<C> {
  protected constructor(
    config: C,
    protected readonly clientImplFactory: ImplFactory<NextClientImpl, C>
  ) {
    super(config);
  }

  protected createClientToolset<A extends AnyAtlas>(rMachine: RMachine<A>): NextClientToolset<A> {
    return createNextClientToolset(rMachine, this.clientImplFactory(rMachine, this.config));
  }
}
