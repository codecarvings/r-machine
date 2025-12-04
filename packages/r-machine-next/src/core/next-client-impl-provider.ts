import type { AnyAtlas, RMachine } from "r-machine";
import type { ImplFactory } from "r-machine/strategy";
import type { NextClientImpl } from "./next-client-toolset.js";
import { NextStrategy, type NextStrategyKind } from "./next-strategy.js";

export abstract class NextClientImplProvider<SK extends NextStrategyKind, C> extends NextStrategy<SK, C> {
  protected constructor(
    kind: SK,
    config: C,
    protected readonly clientImplFactory: ImplFactory<NextClientImpl, C>
  ) {
    super(kind, config);
  }

  protected async createClientToolset<A extends AnyAtlas>(rMachine: RMachine<A>) {
    const impl = await this.clientImplFactory(rMachine, this.config);
    const module = await import("./next-client-toolset.js");
    return module.createNextClientToolset(this.kind, impl, rMachine);
  }
}
