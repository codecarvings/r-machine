/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/next, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

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
