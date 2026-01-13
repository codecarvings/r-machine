import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { AnyPathAtlas } from "#r-machine/next/core";
import {
  type NextAppPathStrategyConfig,
  NextAppPathStrategyCore,
  type PartialNextAppPathStrategyConfig,
} from "#r-machine/next/core/app";

export class NextAppPathStrategy<
  RA extends AnyResourceAtlas,
  PA extends AnyPathAtlas = InstanceType<typeof NextAppPathStrategyCore.defaultConfig.PathAtlas>,
  LK extends string = typeof NextAppPathStrategyCore.defaultConfig.localeKey,
> extends NextAppPathStrategyCore<RA, NextAppPathStrategyConfig<PA, LK>> {
  constructor(rMachine: RMachine<RA>);
  constructor(rMachine: RMachine<RA>, config: PartialNextAppPathStrategyConfig<PA, LK>);
  constructor(rMachine: RMachine<RA>, config: PartialNextAppPathStrategyConfig<PA, LK> = {}) {
    super(rMachine, {
      ...NextAppPathStrategyCore.defaultConfig,
      ...config,
    } as NextAppPathStrategyConfig<PA, LK>);
  }
}
