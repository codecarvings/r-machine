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
  E extends ResEquipment<RA>,
  EF extends ExperimentalFlags,
  CKM extends NextClientPlugKitMap<RA>,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends NextAppPathStrategyCore<RA, L, E, EF, NextAppPathStrategyConfig<RA, CKM, SKM, PA, LK>> {
  static create<
    RA extends AnyResAtlas,
    L extends AnyLocale,
    E extends ResEquipment<RA>,
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
