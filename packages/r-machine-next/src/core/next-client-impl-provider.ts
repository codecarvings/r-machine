import type { AnyAtlas, RMachine } from "r-machine";
import { createNextClientImplPackage, type NextClientImpl } from "./next-client-impl.js";
import { createNextClientToolset, type NextClientToolset } from "./next-client-toolset.js";
import { NextStrategy } from "./next-strategy.js";

export abstract class NextClientImplProvider<C> extends NextStrategy<C> {
  protected constructor(
    config: C,
    protected readonly clientImpl: NextClientImpl<C>
  ) {
    super(config);
  }

  protected createClientToolset<A extends AnyAtlas>(rMachine: RMachine<A>): NextClientToolset<A> {
    return createNextClientToolset(rMachine, this.config, createNextClientImplPackage(this.clientImpl));
  }
}
