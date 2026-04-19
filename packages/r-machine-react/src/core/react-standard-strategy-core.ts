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

import type { AnyResAtlas, ResEquipment } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { CustomLocaleDetector, CustomLocaleStore } from "r-machine/strategy";
import { createReactStandardImpl } from "./react-standard.impl.js";
import { ReactStrategyCore } from "./react-strategy-core.js";

export interface ReactStandardStrategyConfig {
  readonly localeDetector: CustomLocaleDetector | undefined;
  readonly localeStore: CustomLocaleStore | undefined;
}
export interface PartialReactStandardStrategyConfig {
  readonly localeDetector?: CustomLocaleDetector | undefined;
  readonly localeStore?: CustomLocaleStore | undefined;
}

const defaultConfig: ReactStandardStrategyConfig = {
  localeDetector: undefined,
  localeStore: undefined,
};

export abstract class ReactStandardStrategyCore<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends ResEquipment<RA>,
> extends ReactStrategyCore<RA, L, E, ReactStandardStrategyConfig> {
  static readonly defaultConfig = defaultConfig;

  protected createImpl() {
    return createReactStandardImpl<RA, L, E>(this.rMachine, this.config);
  }
}
