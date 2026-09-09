/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { RMachine } from "r-machine";
import { type AnyResAtlas, type AnyResEquipment, type ExperimentalFlags, getNamespaceMap } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { AnyPathAtlas, NextClientPlugKitMap, NextServerPlugKitMap } from "#r-machine/next/core";
import {
  type NextAppFlatStrategyConfig,
  type NextAppFlatStrategyConfigParams,
  NextAppFlatStrategyCore,
} from "#r-machine/next/core/app/flat";

export const convertNextAppFlatStrategyConfigParamsToConfig = <
  RA extends AnyResAtlas,
  CKM extends NextClientPlugKitMap<RA>,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
>(
  params: NextAppFlatStrategyConfigParams<RA, CKM, SKM, PA, LK>
): NextAppFlatStrategyConfig<RA, CKM, SKM, PA, LK> => {
  const { clientKit, serverKit, ...restParams } = params;

  return {
    ...NextAppFlatStrategyCore.defaultConfig,
    ...restParams,
    clientKit: Object.freeze(getNamespaceMap(clientKit ?? {})),
    serverKit: Object.freeze(getNamespaceMap(serverKit ?? {})),
  } as NextAppFlatStrategyConfig<RA, CKM, SKM, PA, LK>;
};

export class NextAppFlatStrategy<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends AnyResEquipment<RA>,
  EF extends ExperimentalFlags,
  CKM extends NextClientPlugKitMap<RA>,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends NextAppFlatStrategyCore<RA, L, E, EF, NextAppFlatStrategyConfig<RA, CKM, SKM, PA, LK>> {
  static create<
    RA extends AnyResAtlas,
    L extends AnyLocale,
    E extends AnyResEquipment<RA>,
    EF extends ExperimentalFlags,
    CKM extends NextClientPlugKitMap<RA> = {},
    SKM extends NextServerPlugKitMap<RA> = {},
    PA extends AnyPathAtlas = InstanceType<typeof NextAppFlatStrategyCore.defaultConfig.PathAtlas>,
    LK extends string = typeof NextAppFlatStrategyCore.defaultConfig.localeKey,
  >(
    rMachine: RMachine<RA, L, E, EF>,
    config: NextAppFlatStrategyConfigParams<RA, CKM, SKM, PA, LK>
  ): NextAppFlatStrategy<RA, L, E, EF, CKM, SKM, PA, LK> {
    return new NextAppFlatStrategy<RA, L, E, EF, CKM, SKM, PA, LK>(
      rMachine,
      convertNextAppFlatStrategyConfigParamsToConfig(config)
    );
  }
}
