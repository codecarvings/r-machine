import type { AnyResourceAtlas, RMachine } from "r-machine";
import { type PartialReactStandardStrategyConfig, ReactStandardStrategyCore } from "#r-machine/react/core";

export class ReactStandardStrategy<RA extends AnyResourceAtlas> extends ReactStandardStrategyCore<RA> {
  constructor(rMachine: RMachine<RA>);
  constructor(rMachine: RMachine<RA>, config: PartialReactStandardStrategyConfig);
  constructor(rMachine: RMachine<RA>, config: PartialReactStandardStrategyConfig = {}) {
    super(rMachine, {
      ...ReactStandardStrategyCore.defaultConfig,
      ...config,
    });
  }
}
