import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import { type PartialReactStandardStrategyConfig, ReactStandardStrategyCore } from "#r-machine/react/core";

export class ReactStandardStrategy<RA extends AnyResourceAtlas, L extends AnyLocale> extends ReactStandardStrategyCore<
  RA,
  L
> {
  constructor(rMachine: RMachine<RA, L>);
  constructor(rMachine: RMachine<RA, L>, config: PartialReactStandardStrategyConfig);
  constructor(rMachine: RMachine<RA, L>, config: PartialReactStandardStrategyConfig = {}) {
    super(rMachine, {
      ...ReactStandardStrategyCore.defaultConfig,
      ...config,
    });
  }
}
