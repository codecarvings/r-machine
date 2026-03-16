import type { AnyLocale, AnyResourceAtlas } from "r-machine";
import { Strategy } from "r-machine/strategy";
import { createReactToolset, type ReactImpl, type ReactToolset } from "./react-toolset.js";

export abstract class ReactStrategyCore<RA extends AnyResourceAtlas, L extends AnyLocale, C> extends Strategy<
  RA,
  L,
  C
> {
  protected abstract createImpl(): Promise<ReactImpl<L>>;

  async createToolset(): Promise<ReactToolset<RA, L>> {
    const impl = await this.createImpl();
    return await createReactToolset(this.rMachine, impl);
  }
}
