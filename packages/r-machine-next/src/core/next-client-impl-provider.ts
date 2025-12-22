import type { AnyAtlas, RMachine } from "r-machine";
import type { ImplFactory } from "r-machine/strategy";
import type { NextClientToolset } from "#r-machine/next/core";
import type { NextClientImpl, NextClientRMachine } from "./next-client-toolset.js";
import { NextStrategy, type NextStrategyKind } from "./next-strategy.js";

export abstract class NextClientImplProvider<A extends AnyAtlas, SK extends NextStrategyKind, C> extends NextStrategy<
  A,
  SK,
  C
> {
  protected constructor(
    rMachine: RMachine<A>,
    kind: SK,
    config: C,
    protected readonly clientImplFactory: ImplFactory<NextClientImpl, C>
  ) {
    super(rMachine, kind, config);
  }

  protected NextClientRMachine: NextClientRMachine | undefined;
  protected clientToolsetPromise: Promise<NextClientToolset<SK, A>> | undefined;
  getClientToolset(): Promise<NextClientToolset<SK, A>> {
    if (this.clientToolsetPromise === undefined) {
      this.clientToolsetPromise = (async () => {
        const impl = await this.clientImplFactory(this.rMachine, this.config);
        const module = await import("./next-client-toolset.js");
        return module.createNextClientToolset(this.kind, impl, this.rMachine, (NextClientRMachine) => {
          this.NextClientRMachine = NextClientRMachine;
        });
      })();
    }
    return this.clientToolsetPromise;
  }
}
