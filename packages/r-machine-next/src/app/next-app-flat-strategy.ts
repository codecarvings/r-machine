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
import type { AnyLocale } from "r-machine/locale";
import type { AnyPathAtlas } from "#r-machine/next/core";
import {
  type NextAppFlatStrategyConfig,
  NextAppFlatStrategyCore,
  type PartialNextAppFlatStrategyConfig,
} from "#r-machine/next/core/app";

export class NextAppFlatStrategy<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  PA extends AnyPathAtlas = InstanceType<typeof NextAppFlatStrategyCore.defaultConfig.PathAtlas>,
  LK extends string = typeof NextAppFlatStrategyCore.defaultConfig.localeKey,
> extends NextAppFlatStrategyCore<RA, L, NextAppFlatStrategyConfig<PA, LK>> {
  constructor(rMachine: RMachine<RA, L>);
  constructor(rMachine: RMachine<RA, L>, config: PartialNextAppFlatStrategyConfig<PA, LK>);
  constructor(rMachine: RMachine<RA, L>, config: PartialNextAppFlatStrategyConfig<PA, LK> = {}) {
    super(rMachine, {
      ...NextAppFlatStrategyCore.defaultConfig,
      ...config,
    } as NextAppFlatStrategyConfig<PA, LK>);
  }
}
