import type { AnyAtlas, RMachine } from "r-machine";
import type { AnyPathAtlas, PathHelper } from "#r-machine/next/core";
import {
  type NextAppFlatStrategyConfig,
  NextAppFlatStrategyCore,
  type PartialNextAppFlatStrategyConfig,
} from "#r-machine/next/core/app";

export class NextAppFlatStrategy<
  A extends AnyAtlas,
  PA extends AnyPathAtlas = (typeof NextAppFlatStrategyCore.defaultConfig)["pathAtlas"],
  LK extends string = (typeof NextAppFlatStrategyCore.defaultConfig)["localeKey"],
> extends NextAppFlatStrategyCore<A, NextAppFlatStrategyConfig<PA, LK>> {
  constructor(rMachine: RMachine<A>);
  constructor(rMachine: RMachine<A>, config: PartialNextAppFlatStrategyConfig<PA, LK>);
  constructor(rMachine: RMachine<A>, config: PartialNextAppFlatStrategyConfig<PA, LK> = {}) {
    super(
      rMachine,
      {
        ...NextAppFlatStrategyCore.defaultConfig,
        ...config,
      } as NextAppFlatStrategyConfig<PA, LK>,
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-flat.client-impl.js");
        return module.createNextAppFlatClientImpl(rMachine, strategyConfig);
      },
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-flat.server-impl.js");
        return module.createNextAppFlatServerImpl(rMachine, strategyConfig);
      }
    );
  }

  // TODO: Implement PathHelper
  readonly PathHelper: PathHelper<PA> = undefined!;
}
