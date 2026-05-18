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

import {
  type AnyResAtlas,
  type AnyResAtlasClass,
  type AnyResEquipment,
  type AnyResLayout,
  type BaseGearNamespaceList,
  type ExperimentalFlags,
  type GearPlugKitMap,
  getNamespaceList,
  getNamespaceMap,
  type NamespaceList,
  type ResEquipment,
  type ResModuleLoaderFn,
  type ShellPlugKitMap,
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
  readonly instanceName: string;
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
  readonly instanceName?: string;
  readonly locales: LL;
  readonly defaultLocale: LL[number];
  readonly ResourceAtlas: RAC;
  readonly load: ResModuleLoaderFn;
  readonly bridgeGears?: BGL;
  readonly gearKit?: GK;
  readonly shellKit?: SK;
  readonly experimental?: EF & ExperimentalFlags;
}

export function convertRMachineConfigParamsToConfig<
  RAC extends AnyResAtlasClass,
  LL extends AnyLocaleList,
  BGL extends BaseGearNamespaceList<InstanceType<RAC>>,
  GK extends GearPlugKitMap<InstanceType<RAC>>,
  SK extends ShellPlugKitMap<InstanceType<RAC>, BGL>,
  EF extends ExperimentalFlags,
>(
  params: RMachineConfigParams<RAC, LL, BGL, GK, SK, EF>
): RMachineConfig<InstanceType<RAC>, LL[number], ResEquipment<InstanceType<RAC>, BGL, GK, SK>, EF> {
  // Normalize all user-supplied namespace collections through getNamespaceList /
  // getNamespaceMap — these route every entry through getNamespace(), which
  // strips a leading `#` (internal-namespace marker). After this single
  // materialization the rest of the runtime (BlueprintManager kit deps,
  // JunctureManager kit injection, composer dep tracking) sees only bare names.
  const priority = Object.freeze(getNamespaceList(params.ResourceAtlas.priority as never)) as NamespaceList<
    InstanceType<RAC>
  >;
  const bridgeGears = Object.freeze(getNamespaceList((params.bridgeGears ?? []) as never)) as BGL;
  const gearKit = Object.freeze(getNamespaceMap((params.gearKit ?? {}) as never)) as GK;
  const shellKit = Object.freeze(getNamespaceMap((params.shellKit ?? {}) as never)) as SK;

  return {
    instanceName: params.instanceName ?? "default",
    locales: Object.freeze([...params.locales]),
    defaultLocale: params.defaultLocale,
    resourceAtlas: undefined!,
    load: params.load,
    layout: Object.freeze({ ...params.ResourceAtlas.layout }),
    priority,
    equipment: {
      bridgeGears,
      gearKit,
      shellKit,
    },
    experimental: Object.freeze({ ...(params.experimental ?? ({} as EF)) }),
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
