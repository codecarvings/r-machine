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

import type { AnyResAtlas, ExperimentalFlags, ResEquipment } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { CustomLocaleDetector, CustomLocaleStore } from "r-machine/strategy";
import type { ReactPlugKitMap } from "./react-plug.js";
import { createReactStandardImpl } from "./react-standard.impl.js";
import { type PartialReactStrategyConfig, type ReactStrategyConfig, ReactStrategyCore } from "./react-strategy-core.js";

export interface ReactStandardStrategyConfig<RA extends AnyResAtlas, KM extends ReactPlugKitMap<RA>>
  extends ReactStrategyConfig<RA, KM> {
  readonly localeDetector: CustomLocaleDetector | undefined;
  readonly localeStore: CustomLocaleStore | undefined;
}
export type AnyReactStandardStrategyConfig<RA extends AnyResAtlas = AnyResAtlas> = ReactStandardStrategyConfig<
  RA,
  ReactPlugKitMap<RA>
>;
export interface PartialReactStandardStrategyConfig<RA extends AnyResAtlas, KM extends ReactPlugKitMap<RA>>
  extends PartialReactStrategyConfig<RA, KM> {
  readonly localeDetector?: CustomLocaleDetector | undefined;
  readonly localeStore?: CustomLocaleStore | undefined;
}

const defaultConfig: AnyReactStandardStrategyConfig = {
  ...ReactStrategyCore.defaultConfig,
  localeDetector: undefined,
  localeStore: undefined,
};

export abstract class ReactStandardStrategyCore<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends ResEquipment<RA>,
  EF extends ExperimentalFlags,
  C extends AnyReactStandardStrategyConfig<RA>,
> extends ReactStrategyCore<RA, L, E, EF, C> {
  static override readonly defaultConfig = defaultConfig;

  protected createImpl() {
    return createReactStandardImpl<RA, L, E, EF, C>(this.rMachine, this.config);
  }
}
