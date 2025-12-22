import type { AnyAtlas, RMachine } from "r-machine";
import { getImplFactory, type ImplFactory, type ImplProvider, Strategy } from "r-machine/strategy";
import {
  createReactStandardToolset,
  type ReactStandardImpl,
  type ReactStandardToolset,
} from "./react-standard-toolset.js";

export class ReactStandardImplProvider<A extends AnyAtlas, C> extends Strategy<A, C> {
  protected constructor(
    rMachine: RMachine<A>,
    config: C,
    protected readonly implFactory: ImplFactory<ReactStandardImpl, C>
  ) {
    super(rMachine, config);
  }

  protected toolsetPromise: Promise<ReactStandardToolset<A>> | undefined;
  getToolset(): Promise<ReactStandardToolset<A>> {
    if (this.toolsetPromise === undefined) {
      this.toolsetPromise = (async () => {
        const impl = await this.implFactory(this.rMachine, this.config);
        return await createReactStandardToolset(impl, this.rMachine);
      })();
    }
    return this.toolsetPromise;
  }

  static define<A extends AnyAtlas>(
    rMachine: RMachine<A>,
    impl: ImplProvider<ReactStandardImpl, undefined>
  ): ReactStandardImplProvider<A, undefined>;
  static define<A extends AnyAtlas, C>(
    rMachine: RMachine<A>,
    impl: ImplProvider<ReactStandardImpl, C>,
    config: C
  ): ReactStandardImplProvider<A, C>;
  static define<A extends AnyAtlas, C>(rMachine: RMachine<A>, impl: ImplProvider<ReactStandardImpl, C>, config?: C) {
    return new ReactStandardImplProvider<A, C>(rMachine, config as C, getImplFactory(impl));
  }
}
