import type { AnyAtlas, RMachine } from "r-machine";
import { type BinFactoryMap, defaultBinFactory } from "r-machine/strategy";
import type { ReactStandardImpl } from "./react-standard-impl.js";
import { createReactStandardToolset, type ReactStandardToolset } from "./react-standard-toolset.js";
import { ReactStrategy } from "./react-strategy.js";

const binFactories: BinFactoryMap<ReactStandardImpl<any>> = {
  readLocale: defaultBinFactory,
  writeLocale: defaultBinFactory,
};

export class ReactStandardImplProvider<C> extends ReactStrategy<C> {
  protected constructor(
    config: C,
    protected readonly impl: ReactStandardImpl<C>
  ) {
    super(config);
  }

  protected createToolset<A extends AnyAtlas>(rMachine: RMachine<A>): ReactStandardToolset<A> {
    return createReactStandardToolset(rMachine, this.config, {
      impl: this.impl,
      binFactories,
    });
  }

  static define(impl: ReactStandardImpl<undefined>): ReactStandardImplProvider<undefined>;
  static define<C>(config: C, impl: ReactStandardImpl<C>): ReactStandardImplProvider<C>;
  static define<C>(config_or_impl: C | ReactStandardImpl<undefined>, impl_or_undefined?: ReactStandardImpl<C>) {
    if (impl_or_undefined !== undefined) {
      return new ReactStandardImplProvider<C>(config_or_impl as C, impl_or_undefined);
    } else {
      return new ReactStandardImplProvider<undefined>(undefined, config_or_impl as ReactStandardImpl<undefined>);
    }
  }
}
