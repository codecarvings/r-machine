import type { AnyAtlas, RMachine } from "r-machine";
import { type ImplFactory, Strategy } from "r-machine/strategy";
import type { NextClientImpl, NextClientToolset, NextClientToolsetEnvelope } from "./next-client-toolset.js";

export abstract class NextStrategyCore<A extends AnyAtlas, C> extends Strategy<A, C> {
  protected constructor(
    rMachine: RMachine<A>,
    config: C,
    protected readonly clientImplFactory: ImplFactory<NextClientImpl, C>
  ) {
    super(rMachine, config);
  }

  protected readonly createClientToolsetEnvelope = async (): Promise<NextClientToolsetEnvelope<A>> => {
    const impl = await this.clientImplFactory(this.rMachine, this.config);
    const module = await import("./next-client-toolset.js");
    return module.createNextClientToolsetEnvelope(this.rMachine, impl);
  };
  protected getClientToolsetEnvelope(): Promise<NextClientToolsetEnvelope<A>> {
    return this.getCached(this.createClientToolsetEnvelope);
  }
  async getClientToolset(): Promise<NextClientToolset<A>> {
    const envelope = await this.getClientToolsetEnvelope();
    return envelope.toolset;
  }
}
