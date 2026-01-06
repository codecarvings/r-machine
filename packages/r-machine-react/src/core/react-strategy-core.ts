import type { AnyAtlas } from "r-machine";
import { Strategy } from "r-machine/strategy";
import { createReactToolset, type ReactImpl, type ReactToolset } from "./react-toolset.js";

export abstract class ReactStrategyCore<A extends AnyAtlas, C> extends Strategy<A, C> {
  protected abstract createImpl(): Promise<ReactImpl>;

  async createToolset(): Promise<ReactToolset<A>> {
    const impl = await this.createImpl();
    return await createReactToolset(this.rMachine, impl);
  }
}
