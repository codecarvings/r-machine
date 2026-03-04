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
  type NextAppOriginStrategyConfig,
  NextAppOriginStrategyCore,
  type PartialNextAppOriginStrategyConfig,
} from "#r-machine/next/core/app";

export class NextAppOriginStrategy<
  RA extends AnyResourceAtlas,
  PA extends AnyPathAtlas = InstanceType<typeof NextAppOriginStrategyCore.defaultConfig.PathAtlas>,
  LK extends string = typeof NextAppOriginStrategyCore.defaultConfig.localeKey,
> extends NextAppOriginStrategyCore<RA, NextAppOriginStrategyConfig<PA, LK>> {
  // Config is required since localeOriginMap is required
  constructor(rMachine: RMachine<RA>, config: PartialNextAppOriginStrategyConfig<PA, LK>) {
    super(rMachine, {
      ...NextAppOriginStrategyCore.defaultConfig,
      ...config,
    } as NextAppOriginStrategyConfig<PA, LK>);
  }
}
