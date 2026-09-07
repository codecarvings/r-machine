/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

import type { RMachine } from "r-machine";
import { type AnyResAtlas, type AnyResEquipment, type ExperimentalFlags, getNamespaceMap } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { AnyPathAtlas, NextClientPlugKitMap, NextServerPlugKitMap } from "#r-machine/next/core";
import {
  type NextAppPathStrategyConfig,
  type NextAppPathStrategyConfigParams,
  NextAppPathStrategyCore,
} from "#r-machine/next/core/app/path";

export const convertNextAppPathStrategyConfigParamsToConfig = <
  RA extends AnyResAtlas,
  CKM extends NextClientPlugKitMap<RA>,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
>(
  params: NextAppPathStrategyConfigParams<RA, CKM, SKM, PA, LK>
): NextAppPathStrategyConfig<RA, CKM, SKM, PA, LK> => {
  const { clientKit, serverKit, ...restParams } = params;

  return {
    ...NextAppPathStrategyCore.defaultConfig,
    ...restParams,
    clientKit: Object.freeze(getNamespaceMap(clientKit ?? {})),
    serverKit: Object.freeze(getNamespaceMap(serverKit ?? {})),
  } as NextAppPathStrategyConfig<RA, CKM, SKM, PA, LK>;
};

export class NextAppPathStrategy<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends AnyResEquipment<RA>,
  EF extends ExperimentalFlags,
  CKM extends NextClientPlugKitMap<RA>,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends NextAppPathStrategyCore<RA, L, E, EF, NextAppPathStrategyConfig<RA, CKM, SKM, PA, LK>> {
  static create<
    RA extends AnyResAtlas,
    L extends AnyLocale,
    E extends AnyResEquipment<RA>,
    EF extends ExperimentalFlags,
    CKM extends NextClientPlugKitMap<RA> = {},
    SKM extends NextServerPlugKitMap<RA> = {},
    PA extends AnyPathAtlas = InstanceType<typeof NextAppPathStrategyCore.defaultConfig.PathAtlas>,
    LK extends string = typeof NextAppPathStrategyCore.defaultConfig.localeKey,
  >(
    rMachine: RMachine<RA, L, E, EF>,
    config: NextAppPathStrategyConfigParams<RA, CKM, SKM, PA, LK>
  ): NextAppPathStrategy<RA, L, E, EF, CKM, SKM, PA, LK> {
    return new NextAppPathStrategy<RA, L, E, EF, CKM, SKM, PA, LK>(
      rMachine,
      convertNextAppPathStrategyConfigParamsToConfig(config)
    );
  }
}
