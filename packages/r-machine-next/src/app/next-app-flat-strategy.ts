import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { AnyPathAtlas } from "#r-machine/next/core";
import {
  type NextAppFlatStrategyConfig,
  NextAppFlatStrategyCore,
  type PartialNextAppFlatStrategyConfig,
} from "#r-machine/next/core/app";

export class NextAppFlatStrategy<
  RA extends AnyResourceAtlas,
  PA extends AnyPathAtlas = InstanceType<typeof NextAppFlatStrategyCore.defaultConfig.PathAtlas>,
  LK extends string = typeof NextAppFlatStrategyCore.defaultConfig.localeKey,
> extends NextAppFlatStrategyCore<RA, NextAppFlatStrategyConfig<PA, LK>> {
  constructor(rMachine: RMachine<RA>);
  constructor(rMachine: RMachine<RA>, config: PartialNextAppFlatStrategyConfig<PA, LK>);
  constructor(rMachine: RMachine<RA>, config: PartialNextAppFlatStrategyConfig<PA, LK> = {}) {
    super(rMachine, {
      ...NextAppFlatStrategyCore.defaultConfig,
      ...config,
    } as NextAppFlatStrategyConfig<PA, LK>);
  }
}
