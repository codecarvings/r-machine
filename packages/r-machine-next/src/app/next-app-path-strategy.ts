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

import type { AnyFmtProvider, AnyResourceAtlas, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import type { AnyPathAtlas } from "#r-machine/next/core";
import {
  type NextAppPathStrategyConfig,
  NextAppPathStrategyCore,
  type PartialNextAppPathStrategyConfig,
} from "#r-machine/next/core/app";

export class NextAppPathStrategy<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  FP extends AnyFmtProvider,
  PA extends AnyPathAtlas = InstanceType<typeof NextAppPathStrategyCore.defaultConfig.PathAtlas>,
  LK extends string = typeof NextAppPathStrategyCore.defaultConfig.localeKey,
> extends NextAppPathStrategyCore<RA, L, FP, NextAppPathStrategyConfig<PA, LK>> {
  constructor(rMachine: RMachine<RA, L, FP>);
  constructor(rMachine: RMachine<RA, L, FP>, config: PartialNextAppPathStrategyConfig<PA, LK>);
  constructor(rMachine: RMachine<RA, L, FP>, config: PartialNextAppPathStrategyConfig<PA, LK> = {}) {
    super(rMachine, {
      ...NextAppPathStrategyCore.defaultConfig,
      ...config,
    } as NextAppPathStrategyConfig<PA, LK>);
  }
}
