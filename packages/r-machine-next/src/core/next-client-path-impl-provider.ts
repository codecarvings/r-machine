import type { AnyAtlas, RMachine } from "r-machine";
import type { ImplFactory } from "r-machine/strategy";
import type { NextClientPathImpl, NextClientPathToolset } from "./next-client-path-toolset.js";
import { NextStrategy } from "./next-strategy.js";

export abstract class NextClientPathImplProvider<C> extends NextStrategy<C> {
  protected constructor(
    config: C,
    protected readonly clientImplFactory: ImplFactory<NextClientPathImpl, C>
  ) {
    super(config);
  }

  protected async createClientToolset<A extends AnyAtlas>(rMachine: RMachine<A>): Promise<NextClientPathToolset<A>> {
    const impl = await this.clientImplFactory(rMachine, this.config);
    const module = await import("./next-client-path-toolset.js");
    return module.createNextClientPathToolset(rMachine, impl);
  }
}
