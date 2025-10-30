import type { AnyAtlas, RMachine } from "r-machine";
import { createReactStandardImplPackage, type ReactStandardImpl } from "./react-standard-impl.js";
import { createReactStandardToolset, type ReactStandardToolset } from "./react-standard-toolset.js";
import { ReactStrategy } from "./react-strategy.js";

export class ReactStandardImplProvider<C> extends ReactStrategy<C> {
  protected constructor(
    config: C,
    protected readonly impl: ReactStandardImpl<C>
  ) {
    super(config);
  }

  protected createToolset<A extends AnyAtlas>(rMachine: RMachine<A>): ReactStandardToolset<A> {
    return createReactStandardToolset(rMachine, this.config, createReactStandardImplPackage(this.impl));
  }

  static define(impl: ReactStandardImpl<undefined>): ReactStandardImplProvider<undefined>;
  static define<C>(impl: ReactStandardImpl<C>, config: C): ReactStandardImplProvider<C>;
  static define<C>(impl: ReactStandardImpl<C>, config?: C) {
    return new ReactStandardImplProvider<C>(config as C, impl);
  }
}
