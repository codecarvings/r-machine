/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of r-machine, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

import type { AnyPlugHead, AnyRes, GateWire, ResEquipment, VertexGearMap } from "#r-machine/core";
import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "#r-machine/errors";
import type { AnyLocale, AnyLocaleList, LocaleList } from "#r-machine/locale";
import { LocaleHelper } from "#r-machine/locale";
import type { AnyNamespace } from "../core/res-atlas.js";
import {
  cloneRMachineConfig,
  convertParamsToConfig,
  type RMachineConfig,
  type RMachineConfigParams,
  validateRMachineConfig,
} from "./r-machine-config.js";
import type { RMachineToolset } from "./r-machine-toolset.js";
import type {
  AnyResAtlasClass,
  AnyResAtlasInstance,
  BridgeGearNamespace,
  GateKit,
  GearKit,
  ShellKit,
} from "./resource-atlas.js";

export class RMachine<
  ATLAS extends AnyResAtlasInstance,
  L extends AnyLocale,
  K extends ResEquipment<ATLAS["res"], any, any, any, any>,
> {
  constructor(config: RMachineConfig<ATLAS, L, K>) {
    const configError = validateRMachineConfig(config);
    if (configError) {
      throw configError;
    }
    this.config = cloneRMachineConfig(config);
    this.locales = this.config.locales;
    this.defaultLocale = this.config.defaultLocale;
    this.localeHelper = new LocaleHelper(this.config.locales, this.config.defaultLocale);
  }

  readonly locales: LocaleList<L>;
  readonly defaultLocale: L;
  readonly localeHelper: LocaleHelper<L>;
  protected readonly config: RMachineConfig<ATLAS, L, K>;

  protected validateLocaleForPick(locale: L) {
    const error = this.localeHelper.validateLocale(locale);
    if (error) {
      throw new RMachineUsageError(ERR_UNKNOWN_LOCALE, `Cannot use invalid locale: "${locale}".`, error);
    }
  }

  createToolset(): RMachineToolset<ATLAS, L, K> {
    const Gear = undefined!; // TODO: WIP;
    const VertexGear = undefined!; // TODO: WIP;
    const Shell = undefined!; // TODO: WIP;
    return { Gear, VertexGear, Shell, localized };
  }

  getGateWire(_plugHead: AnyPlugHead, _locale: L, _vertexGearMap?: VertexGearMap | undefined): GateWire {
    return undefined!; // TODO: WIP;
  }

  static create<
    CLASS extends AnyResAtlasClass,
    const LL extends AnyLocaleList,
    const BG extends readonly BridgeGearNamespace<InstanceType<CLASS>>[] = readonly [],
    GKA extends GearKit<InstanceType<CLASS>> = {},
    SKA extends ShellKit<InstanceType<CLASS>, BG> = {},
    XKA extends GateKit<InstanceType<CLASS>> = {},
  >(
    config: RMachineConfigParams<CLASS, LL, BG, GKA, SKA, XKA>
  ): RMachine<InstanceType<CLASS>, LL[number], ResEquipment<InstanceType<CLASS>["res"], GKA, SKA, XKA, BG>> {
    return new RMachine<InstanceType<CLASS>, LL[number], ResEquipment<InstanceType<CLASS>["res"], GKA, SKA, XKA, BG>>(
      convertParamsToConfig(config)
    );
  }
}

export type RMachineLocale<RM extends RMachine<any, any, any>> = RM extends RMachine<any, infer L, any> ? L : never;

function localized<S extends AnyRes>(_namespace: AnyNamespace, shell: S): S {
  return shell;
}
