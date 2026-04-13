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
import type { AnyResAtlas, ResKit } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { AnyPathAtlasDeclaration } from "#r-machine/next/core";
import {
  type NextAppFlatStrategyConfig,
  NextAppFlatStrategyCore,
  type PartialNextAppFlatStrategyConfig,
} from "#r-machine/next/core/app";

export class NextAppFlatStrategy<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends ResKit<RA>,
  PAD extends AnyPathAtlasDeclaration = InstanceType<typeof NextAppFlatStrategyCore.defaultConfig.PathAtlas>,
  LK extends string = typeof NextAppFlatStrategyCore.defaultConfig.localeKey,
> extends NextAppFlatStrategyCore<RA, L, KA, NextAppFlatStrategyConfig<PAD, LK>> {
  constructor(rMachine: RMachine<RA, L, KA>);
  constructor(rMachine: RMachine<RA, L, KA>, config: PartialNextAppFlatStrategyConfig<PAD, LK>);
  constructor(rMachine: RMachine<RA, L, KA>, config: PartialNextAppFlatStrategyConfig<PAD, LK> = {}) {
    super(rMachine, {
      ...NextAppFlatStrategyCore.defaultConfig,
      ...config,
    } as NextAppFlatStrategyConfig<PAD, LK>);
  }
}
