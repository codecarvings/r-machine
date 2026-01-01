import type { AnyAtlas, RMachine } from "r-machine";
import { type PartialReactStandardStrategyConfig, ReactStandardStrategyCore } from "#r-machine/react/core";
import { createReactStandardImpl } from "./react-standard.impl.js";

export class ReactStandardStrategy<A extends AnyAtlas> extends ReactStandardStrategyCore<A> {
  constructor(rMachine: RMachine<A>);
  constructor(rMachine: RMachine<A>, config: PartialReactStandardStrategyConfig);
  constructor(rMachine: RMachine<A>, config: PartialReactStandardStrategyConfig = {}) {
    super(
      rMachine,
      {
        ...ReactStandardStrategyCore.defaultConfig,
        ...config,
      },
      createReactStandardImpl
    );
  }
}
