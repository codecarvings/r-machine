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
  type DirectPlugKitMap,
  type ExperimentalFlags,
  type GearPlugKitMap,
  getNamespaceList,
  getNamespaceMap,
  type NamespaceList,
  type ResEquipment,
  type ResourceLoader,
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
  readonly loader: ResourceLoader<AnyResLayout>;
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
  DK extends DirectPlugKitMap<InstanceType<RAC>>,
  EF extends ExperimentalFlags,
> {
  readonly instanceName?: string;
  readonly locales: LL;
  readonly defaultLocale: LL[number];
  readonly ResourceAtlas: RAC;
  readonly bridgeGears?: BGL;
  readonly gearKit?: GK;
  readonly shellKit?: SK;
  readonly directKit?: DK;
  readonly experimental?: EF & ExperimentalFlags;
}

// ─── Internal access symbol ─────────────────────────────────────────────
// Bridge between the public-facing Strategy/RMachine surfaces and the
// underlying RMachineConfig. Tooling that needs to inspect the config
// (e.g. `@r-machine/testing`'s `verifyResourceAtlas`) calls
// `target[CONFIG_ACCESSOR]()`. Not part of the package's typed public
// API surface. Co-located with `RMachineConfig` and `ConfigBridge` for
// the same `unique symbol` identity reason documented on `BUS_ACCESSOR`.

export const CONFIG_ACCESSOR: unique symbol = Symbol("configAccessor");

export interface ConfigBridge<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends AnyResEquipment<RA>,
  EF extends ExperimentalFlags,
> {
  [CONFIG_ACCESSOR](): RMachineConfig<RA, L, E, EF>;
}

export function convertRMachineConfigParamsToConfig<
  RAC extends AnyResAtlasClass,
  LL extends AnyLocaleList,
  BGL extends BaseGearNamespaceList<InstanceType<RAC>>,
  GK extends GearPlugKitMap<InstanceType<RAC>>,
  SK extends ShellPlugKitMap<InstanceType<RAC>, BGL>,
  DK extends DirectPlugKitMap<InstanceType<RAC>>,
  EF extends ExperimentalFlags,
>(
  params: RMachineConfigParams<RAC, LL, BGL, GK, SK, DK, EF>
): RMachineConfig<InstanceType<RAC>, LL[number], ResEquipment<InstanceType<RAC>, BGL, GK, SK, DK>, EF> {
  // Normalize all user-supplied namespace collections through getNamespaceList /
  // getNamespaceMap — these route every entry through getNamespace(), which
  // strips a leading `#` (internal-namespace marker). After this single
  // materialization the rest of the runtime (BlueprintManager kit deps,
  // ResManager kit injection, composer dep tracking) sees only bare names.
  const priority = Object.freeze(getNamespaceList(params.ResourceAtlas.priority as never)) as NamespaceList<
    InstanceType<RAC>
  >;
  const bridgeGears = Object.freeze(getNamespaceList((params.bridgeGears ?? []) as never)) as BGL;
  const gearKit = Object.freeze(getNamespaceMap((params.gearKit ?? {}) as never)) as GK;
  const shellKit = Object.freeze(getNamespaceMap((params.shellKit ?? {}) as never)) as SK;
  const directKit = Object.freeze(getNamespaceMap((params.directKit ?? {}) as never)) as DK;

  return {
    instanceName: params.instanceName ?? "default",
    locales: Object.freeze([...params.locales]),
    defaultLocale: params.defaultLocale,
    resourceAtlas: undefined!,
    loader: params.ResourceAtlas.loader,
    layout: Object.freeze({ ...params.ResourceAtlas.layout }),
    priority,
    equipment: {
      bridgeGears,
      gearKit,
      shellKit,
      directKit,
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
