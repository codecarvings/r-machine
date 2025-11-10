import type { ImplFactory } from "r-machine/strategy";
import type { NextClientImpl } from "#r-machine/next/core";
import { NextAppImplProvider, type NextAppServerImpl } from "#r-machine/next/core/app";

export interface NextAppStrategyConfig<LK extends string> {
  readonly localeKey: LK;
}
export interface PartialNextAppPathStrategyConfig<LK extends string> {
  readonly localeKey?: LK;
}

export abstract class NextAppStrategy<
  LK extends string,
  C extends NextAppStrategyConfig<LK>,
> extends NextAppImplProvider<LK, C> {
  constructor(
    config: C,
    clientImplFactory: ImplFactory<NextClientImpl, C>,
    serverImplFactory: ImplFactory<NextAppServerImpl, C>
  ) {
    super(
      config,
      clientImplFactory,
      serverImplFactory,
      (config.localeKey ?? NextAppImplProvider.defaultLocaleKey) as LK
    );
  }
}
