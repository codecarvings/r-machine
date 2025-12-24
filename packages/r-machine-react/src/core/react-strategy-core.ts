import type { AnyAtlas, RMachine } from "r-machine";
import { type ImplFactory, Strategy } from "r-machine/strategy";
import { createReactToolset, type ReactImpl, type ReactToolset } from "./react-toolset.js";

export class ReactStrategyCore<A extends AnyAtlas, C> extends Strategy<A, C> {
  constructor(
    rMachine: RMachine<A>,
    config: C,
    protected readonly implFactory: ImplFactory<ReactImpl, C>
  ) {
    super(rMachine, config);
  }

  protected readonly createToolset = async (): Promise<ReactToolset<A>> => {
    const impl = await this.implFactory(this.rMachine, this.config);
    return await createReactToolset(this.rMachine, impl);
  };
  getToolset(): Promise<ReactToolset<A>> {
    return this.getCached(this.createToolset);
  }
}
