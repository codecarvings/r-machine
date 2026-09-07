/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

import type { RMachine } from "r-machine";
import { type AnyResAtlas, type ExperimentalFlags, getNamespaceMap, type ResEquipment } from "r-machine/core";
import type { RMachineTypeError } from "r-machine/errors";
import type { AnyLocale } from "r-machine/locale";
import {
  type ReactPlugKitMap,
  type ReactStandardStrategyConfig,
  type ReactStandardStrategyConfigParams,
  ReactStandardStrategyCore,
} from "#r-machine/react/core";

export function convertReactStandardStrategyConfigParamsToConfig<
  RA extends AnyResAtlas,
  KM extends ReactPlugKitMap<RA>,
>(params: ReactStandardStrategyConfigParams<RA, KM>): ReactStandardStrategyConfig<RA, KM> {
  const { kit, ...restParams } = params;

  return {
    ...ReactStandardStrategyCore.defaultConfig,
    ...restParams,
    kit: Object.freeze(getNamespaceMap(kit ?? {})),
  } as ReactStandardStrategyConfig<RA, KM>;
}

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
    params: ReactStandardStrategyConfigParams<RA, KM>,
    ..._atlas_error: [Extract<keyof RA["let@gear:inner"], string>] extends [never]
      ? []
      : [
          RMachineTypeError<`ReactStandardStrategy does not support InnerGear. Remove these "gear:inner" entries from the layout definition: *** ${Extract<
            keyof RA["let@gear:inner"],
            string
          >} ***`>,
        ]
  ): ReactStandardStrategy<RA, L, E, EF, KM> {
    return new ReactStandardStrategy<RA, L, E, EF, KM>(
      rMachine,
      convertReactStandardStrategyConfigParamsToConfig(params)
    );
  }
}
