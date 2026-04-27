/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/react, licensed under the
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
import {
  type PartialReactStandardStrategyConfig,
  type ReactPlugKitMap,
  type ReactStandardStrategyConfig,
  ReactStandardStrategyCore,
} from "#r-machine/react/core";

export class ReactStandardStrategy<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends ResEquipment<RA>,
  EF extends ExperimentalFlags,
  KM extends ReactPlugKitMap<RA> = {},
> extends ReactStandardStrategyCore<RA, L, E, EF, ReactStandardStrategyConfig<RA, KM>> {
  constructor(rMachine: RMachine<RA, L, E, EF>);
  constructor(rMachine: RMachine<RA, L, E, EF>, config: PartialReactStandardStrategyConfig<RA, KM>);
  constructor(rMachine: RMachine<RA, L, E, EF>, config: PartialReactStandardStrategyConfig<RA, KM> = {}) {
    super(rMachine, {
      ...ReactStandardStrategyCore.defaultConfig,
      ...config,
    } as ReactStandardStrategyConfig<RA, KM>);
  }
}
