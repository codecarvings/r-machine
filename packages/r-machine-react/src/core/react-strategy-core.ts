import type { AnyAtlas, RMachine } from "r-machine";
import { getImplFactory, type ImplFactory, type ImplProvider, Strategy } from "r-machine/strategy";
import { createReactToolset, type ReactImpl, type ReactToolset } from "./react-toolset.js";

export class ReactStrategyCore<A extends AnyAtlas, C> extends Strategy<A, C> {
  protected constructor(
    rMachine: RMachine<A>,
    config: C,
    protected readonly implFactory: ImplFactory<ReactImpl, C>
  ) {
    super(rMachine, config);
  }

  protected toolsetPromise: Promise<ReactToolset<A>> | undefined;
  getToolset(): Promise<ReactToolset<A>> {
    if (this.toolsetPromise === undefined) {
      this.toolsetPromise = (async () => {
        const impl = await this.implFactory(this.rMachine, this.config);
        return await createReactToolset(this.rMachine, impl);
      })();
    }
    return this.toolsetPromise;
  }

  static define<A extends AnyAtlas>(
    rMachine: RMachine<A>,
    impl: ImplProvider<ReactImpl, undefined>
  ): ReactStrategyCore<A, undefined>;
  static define<A extends AnyAtlas, C>(
    rMachine: RMachine<A>,
    impl: ImplProvider<ReactImpl, C>,
    config: C
  ): ReactStrategyCore<A, C>;
  static define<A extends AnyAtlas, C>(rMachine: RMachine<A>, impl: ImplProvider<ReactImpl, C>, config?: C) {
    return new ReactStrategyCore<A, C>(rMachine, config as C, getImplFactory(impl));
  }
}
