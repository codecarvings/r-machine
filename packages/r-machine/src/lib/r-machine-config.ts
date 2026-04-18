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

import type {
  AnyResAtlas,
  AnyResAtlasClass,
  BridgeGearNamespace,
  GateKit,
  GearKit,
  ResEquipment,
  ResModuleLoaderFn,
  ShellKit,
} from "#r-machine/core";
import {
  ERR_DEFAULT_LOCALE_NOT_IN_LIST,
  ERR_DUPLICATE_LOCALES,
  ERR_NO_LOCALES,
  RMachineConfigError,
} from "#r-machine/errors";
import {
  type AnyLocale,
  type AnyLocaleList,
  type LocaleList,
  validateCanonicalUnicodeLocaleId,
} from "#r-machine/locale";
import type { AnyResLayout } from "../core/res-layout.js";

export interface RMachineConfigParams<
  RAC extends AnyResAtlasClass,
  LL extends AnyLocaleList,
  BG extends BridgeGearNamespace<InstanceType<RAC>>,
  GKA extends GearKit<InstanceType<RAC>>,
  SKA extends ShellKit<InstanceType<RAC>, BG>,
  XKA extends GateKit<InstanceType<RAC>>,
> {
  readonly ResourceAtlas: RAC;
  readonly locales: LL;
  readonly defaultLocale: LL[number];
  readonly load: ResModuleLoaderFn;
  readonly bridgeGears?: BG;
  readonly gearKit?: GKA;
  readonly shellKit?: SKA;
  readonly gateKit?: XKA;
}

export interface RMachineConfig<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends ResEquipment<RA, any, any, any, any>,
> {
  readonly resourceAtlas: RA;
  readonly locales: LocaleList<L>;
  readonly defaultLocale: L;
  readonly load: ResModuleLoaderFn;
  readonly layout: AnyResLayout;
  readonly equipment: E;
}

export function convertParamsToConfig<
  RAC extends AnyResAtlasClass,
  LL extends AnyLocaleList,
  BG extends BridgeGearNamespace<InstanceType<RAC>>,
  GKA extends GearKit<InstanceType<RAC>>,
  SKA extends ShellKit<InstanceType<RAC>, BG>,
  XKA extends GateKit<InstanceType<RAC>>,
>(
  params: RMachineConfigParams<RAC, LL, BG, GKA, SKA, XKA>
): RMachineConfig<InstanceType<RAC>, LL[number], ResEquipment<InstanceType<RAC>["res"], BG, GKA, SKA, XKA>> {
  return {
    resourceAtlas: params.ResourceAtlas as InstanceType<RAC>,
    locales: [...params.locales],
    defaultLocale: params.defaultLocale,
    load: params.load,
    layout: params.ResourceAtlas.layout,
    equipment: {
      bridgeGears: (params.bridgeGears ?? ([] as readonly unknown[])) as BG,
      gearKit: params.gearKit ?? ({} as GKA),
      shellKit: params.shellKit ?? ({} as SKA),
      gateKit: params.gateKit ?? ({} as XKA),
    },
  };
}

export function validateRMachineConfig(config: RMachineConfig<any, any, any>): RMachineConfigError | null {
  if (!config.locales.length) {
    return new RMachineConfigError(ERR_NO_LOCALES, "No locales provided.");
  }

  for (const locale of config.locales) {
    const error = validateCanonicalUnicodeLocaleId(locale);
    if (error) {
      return error;
    }
  }

  if (new Set(config.locales).size !== config.locales.length) {
    return new RMachineConfigError(ERR_DUPLICATE_LOCALES, "Duplicate locales provided. All locales must be unique.");
  }

  const fallbackLocaleError = validateCanonicalUnicodeLocaleId(config.defaultLocale);
  if (fallbackLocaleError) {
    return fallbackLocaleError;
  }

  if (!config.locales.includes(config.defaultLocale)) {
    return new RMachineConfigError(
      ERR_DEFAULT_LOCALE_NOT_IN_LIST,
      `Default locale "${config.defaultLocale}" is not in the list of locales.`
    );
  }

  return null;
}

export function cloneRMachineConfig<C extends RMachineConfig<any, any, any>>(config: C): C {
  return {
    ...config,
    locales: Object.freeze([...config.locales]) as LocaleList<C["defaultLocale"]>,
    layout: { ...config.layout },
    equipment: {
      bridgeGears: Object.freeze([...config.equipment.bridgeGears]) as C["equipment"]["bridgeGears"],
      gear: { ...config.equipment.gear },
      shell: { ...config.equipment.shell },
      gate: { ...config.equipment.gate },
    },
  };
}
