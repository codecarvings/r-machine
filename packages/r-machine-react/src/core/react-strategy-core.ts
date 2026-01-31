import type { AnyResourceAtlas } from "r-machine";
import { Strategy } from "r-machine/strategy";
import { createReactToolset, type ReactImpl, type ReactToolset } from "./react-toolset.js";

export abstract class ReactStrategyCore<RA extends AnyResourceAtlas, C> extends Strategy<RA, C> {
  protected abstract createImpl(): Promise<ReactImpl>;

  async createToolset(): Promise<ReactToolset<RA>> {
    const impl = await this.createImpl();
    return await createReactToolset(this.rMachine, impl);
  }
}
