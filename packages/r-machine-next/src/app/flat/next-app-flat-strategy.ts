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

import type { RMachine } from "r-machine";
import type { AnyResAtlas, ExperimentalFlags, ResEquipment } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { AnyPathAtlas, NextClientPlugKitMap, NextServerPlugKitMap } from "#r-machine/next/core";
import {
  type NextAppFlatStrategyConfig,
  NextAppFlatStrategyCore,
  type PartialNextAppFlatStrategyConfig,
} from "#r-machine/next/core/app/flat";

export class NextAppFlatStrategy<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends ResEquipment<RA>,
  EF extends ExperimentalFlags,
  CKM extends NextClientPlugKitMap<RA> = {},
  SKM extends NextServerPlugKitMap<RA> = {},
  PA extends AnyPathAtlas = InstanceType<typeof NextAppFlatStrategyCore.defaultConfig.PathAtlas>,
  LK extends string = typeof NextAppFlatStrategyCore.defaultConfig.localeKey,
> extends NextAppFlatStrategyCore<RA, L, E, EF, NextAppFlatStrategyConfig<RA, CKM, SKM, PA, LK>> {
  constructor(rMachine: RMachine<RA, L, E, EF>);
  constructor(rMachine: RMachine<RA, L, E, EF>, config: PartialNextAppFlatStrategyConfig<RA, CKM, SKM, PA, LK>);
  constructor(rMachine: RMachine<RA, L, E, EF>, config: PartialNextAppFlatStrategyConfig<RA, CKM, SKM, PA, LK> = {}) {
    super(rMachine, {
      ...NextAppFlatStrategyCore.defaultConfig,
      ...config,
    } as NextAppFlatStrategyConfig<RA, CKM, SKM, PA, LK>);
  }
}
