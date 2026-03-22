import type { AnyFmtProvider, AnyResourceAtlas } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import { Strategy } from "r-machine/strategy";
import { createReactToolset, type ReactImpl, type ReactToolset } from "./react-toolset.js";

export abstract class ReactStrategyCore<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  FP extends AnyFmtProvider,
  C,
> extends Strategy<RA, L, FP, C> {
  protected abstract createImpl(): Promise<ReactImpl<L>>;

  async createToolset(): Promise<ReactToolset<RA, L, FP>> {
    const impl = await this.createImpl();
    return await createReactToolset(this.rMachine, impl);
  }
}
