import type { AnyFmtProvider, AnyResourceAtlas, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import { type PartialReactStandardStrategyConfig, ReactStandardStrategyCore } from "#r-machine/react/core";

export class ReactStandardStrategy<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  FP extends AnyFmtProvider,
> extends ReactStandardStrategyCore<RA, L, FP> {
  constructor(rMachine: RMachine<RA, L, FP>);
  constructor(rMachine: RMachine<RA, L, FP>, config: PartialReactStandardStrategyConfig);
  constructor(rMachine: RMachine<RA, L, FP>, config: PartialReactStandardStrategyConfig = {}) {
    super(rMachine, {
      ...ReactStandardStrategyCore.defaultConfig,
      ...config,
    });
  }
}
