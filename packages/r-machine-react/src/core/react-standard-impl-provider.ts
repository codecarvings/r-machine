import type { AnyAtlas, RMachine } from "r-machine";
import { getImplFactory, type ImplFactory, type ImplProvider } from "r-machine/strategy";
import {
  createReactStandardToolset,
  type ReactStandardImpl,
  type ReactStandardToolset,
} from "./react-standard-toolset.js";
import { ReactStrategy } from "./react-strategy.js";

export class ReactStandardImplProvider<C> extends ReactStrategy<C> {
  protected constructor(
    config: C,
    protected readonly implFactory: ImplFactory<ReactStandardImpl, C>
  ) {
    super(config);
  }

  protected createToolset<A extends AnyAtlas>(rMachine: RMachine<A>): ReactStandardToolset<A> {
    return createReactStandardToolset(rMachine, this.implFactory(rMachine, this.config));
  }

  static define(impl: ImplProvider<ReactStandardImpl, undefined>): ReactStandardImplProvider<undefined>;
  static define<C>(impl: ImplProvider<ReactStandardImpl, C>, config: C): ReactStandardImplProvider<C>;
  static define<C>(impl: ImplProvider<ReactStandardImpl, C>, config?: C) {
    return new ReactStandardImplProvider<C>(config as C, getImplFactory(impl));
  }
}
