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
  AnyResEquipment,
  AnyResLayout,
  BaseGearNamespaceList,
  ExperimentalFlags,
  GearPlugKitMap,
  NamespaceList,
  ResEquipment,
  ResModuleLoaderFn,
  ShellPlugKitMap,
} from "#r-machine/core";
import {
  ERR_DEFAULT_LOCALE_NOT_IN_LIST,
  ERR_DUPLICATE_LOCALES,
  ERR_EXPERIMENTAL_OUTER_GEAR_REQUIRED,
  ERR_NO_LOCALES,
  RMachineConfigError,
} from "#r-machine/errors";
import {
  type AnyLocale,
  type AnyLocaleList,
  type LocaleList,
  validateCanonicalUnicodeLocaleId,
} from "#r-machine/locale";

export interface RMachineConfig<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends AnyResEquipment<RA>,
  EF extends ExperimentalFlags,
> {
  readonly locales: LocaleList<L>;
  readonly defaultLocale: L;
  readonly resourceAtlas: RA;
  readonly load: ResModuleLoaderFn;
  readonly layout: AnyResLayout;
  readonly priority: NamespaceList<RA>;
  readonly equipment: E;
  readonly experimental: EF;
}

export interface RMachineConfigParams<
  RAC extends AnyResAtlasClass,
  LL extends AnyLocaleList,
  BGL extends BaseGearNamespaceList<InstanceType<RAC>>,
  GK extends GearPlugKitMap<InstanceType<RAC>>,
  SK extends ShellPlugKitMap<InstanceType<RAC>, BGL>,
  EF extends ExperimentalFlags,
> {
  readonly locales: LL;
  readonly defaultLocale: LL[number];
  readonly ResourceAtlas: RAC;
  readonly load: ResModuleLoaderFn;
  readonly bridgeGears?: BGL;
  readonly gearKit?: GK;
  readonly shellKit?: SK;
  readonly experimental?: EF & ExperimentalFlags;
}

export function convertParamsToConfig<
  RAC extends AnyResAtlasClass,
  LL extends AnyLocaleList,
  BGL extends BaseGearNamespaceList<InstanceType<RAC>>,
  GK extends GearPlugKitMap<InstanceType<RAC>>,
  SK extends ShellPlugKitMap<InstanceType<RAC>, BGL>,
  EF extends ExperimentalFlags,
>(
  params: RMachineConfigParams<RAC, LL, BGL, GK, SK, EF>
): RMachineConfig<InstanceType<RAC>, LL[number], ResEquipment<InstanceType<RAC>, BGL, GK, SK>, EF> {
  return {
    locales: [...params.locales],
    defaultLocale: params.defaultLocale,
    resourceAtlas: undefined!,
    load: params.load,
    layout: params.ResourceAtlas.layout,
    priority: params.ResourceAtlas.priority as NamespaceList<InstanceType<RAC>>,
    equipment: {
      bridgeGears: (params.bridgeGears ?? ([] as readonly unknown[])) as BGL,
      gearKit: params.gearKit ?? ({} as GK),
      shellKit: params.shellKit ?? ({} as SK),
    },
    experimental: params.experimental ?? ({} as EF),
  };
}

export function validateRMachineConfig(config: RMachineConfig<any, any, any, any>): RMachineConfigError | null {
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

  if (!config.experimental.outerGear) {
    const outerPrefixes = Object.entries(config.layout)
      .filter(([, type]) => (type as string).startsWith("gear:outer"))
      .map(([prefix]) => prefix);
    if (outerPrefixes.length) {
      return new RMachineConfigError(
        ERR_EXPERIMENTAL_OUTER_GEAR_REQUIRED,
        `Layout contains "gear:outer" entries (${outerPrefixes.map((p) => `"${p}"`).join(", ")}) but the "outerGear" experimental feature is not enabled. Add \`experimental: { outerGear: "on" }\` to RMachine.create(...) to opt in.`
      );
    }
  }

  return null;
}

export function cloneRMachineConfig<C extends RMachineConfig<any, any, any, any>>(config: C): C {
  return {
    ...config,
    locales: Object.freeze([...config.locales]) as LocaleList<C["defaultLocale"]>,
    layout: { ...config.layout },
    priority: Object.freeze([...config.priority]),
    equipment: {
      bridgeGears: Object.freeze([...config.equipment.bridgeGears]),
      gearKit: { ...config.equipment.gearKit },
      shellKit: { ...config.equipment.shellKit },
    },
    experimental: { ...config.experimental },
  };
}
