import type { AnyAtlas, RMachine } from "r-machine";
import type { ImplFactory } from "r-machine/strategy";
import type { NextClientImpl, NextClientToolset } from "./next-client-toolset.js";
import { NextStrategy } from "./next-strategy.js";

export abstract class NextClientImplProvider<C> extends NextStrategy<C> {
  protected constructor(
    config: C,
    protected readonly clientImplFactory: ImplFactory<NextClientImpl, C>
  ) {
    super(config);
  }

  protected async createClientToolset<A extends AnyAtlas>(rMachine: RMachine<A>): Promise<NextClientToolset<A>> {
    const impl = await this.clientImplFactory(rMachine, this.config);
    // Dynamic import to separate client and server code
    const module = await import("./next-client-toolset.js");
    return module.createNextClientToolset(rMachine, impl);
  }
}
