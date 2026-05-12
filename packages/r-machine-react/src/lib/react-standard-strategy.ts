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
import type { RMachineTypeError } from "r-machine/errors";
import type { AnyLocale } from "r-machine/locale";
import {
  type ReactPlugKitMap,
  type ReactStandardStrategyConfig,
  type ReactStandardStrategyConfigParams,
  ReactStandardStrategyCore,
} from "#r-machine/react/core";

export class ReactStandardStrategy<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends ResEquipment<RA>,
  EF extends ExperimentalFlags,
  KM extends ReactPlugKitMap<RA>,
> extends ReactStandardStrategyCore<RA, L, E, EF, ReactStandardStrategyConfig<RA, KM>> {
  static create<
    RA extends AnyResAtlas,
    L extends AnyLocale,
    E extends ResEquipment<RA>,
    EF extends ExperimentalFlags,
    KM extends ReactPlugKitMap<RA> = {},
  >(
    rMachine: RMachine<RA, L, E, EF>,
    config: ReactStandardStrategyConfigParams<RA, KM>,
    ..._atlas_error: [Extract<keyof RA["let@gear:inner"], string>] extends [never]
      ? []
      : [
          RMachineTypeError<`ReactStandardStrategy does not support InnerGear. Remove these "gear:inner" entries from the layout definition: *** ${Extract<
            keyof RA["let@gear:inner"],
            string
          >} ***`>,
        ]
  ): ReactStandardStrategy<RA, L, E, EF, KM> {
    return new ReactStandardStrategy<RA, L, E, EF, KM>(rMachine, {
      ...ReactStandardStrategyCore.defaultConfig,
      ...config,
    } as ReactStandardStrategyConfig<RA, KM>);
  }
}
