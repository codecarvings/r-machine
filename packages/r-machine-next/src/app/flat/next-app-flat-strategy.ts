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
import { type AnyResAtlas, type ExperimentalFlags, getNamespaceMap, type ResEquipment } from "r-machine/core";
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
  E extends ResEquipment<RA>,
  EF extends ExperimentalFlags,
  CKM extends NextClientPlugKitMap<RA>,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends NextAppFlatStrategyCore<RA, L, E, EF, NextAppFlatStrategyConfig<RA, CKM, SKM, PA, LK>> {
  static create<
    RA extends AnyResAtlas,
    L extends AnyLocale,
    E extends ResEquipment<RA>,
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
