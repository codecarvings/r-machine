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

import type { ResEquipment, ResModuleLoaderFn } from "#r-machine/core";
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
import type {
  AnyResAtlasClass,
  AnyResAtlasInstance,
  BridgeGearNamespace,
  GateKit,
  GearKit,
  ShellKit,
  ValidBridgeGears,
} from "./resource-atlas.js";

export interface RMachineConfigParams<
  CLASS extends AnyResAtlasClass,
  LL extends AnyLocaleList,
  BG extends readonly BridgeGearNamespace<InstanceType<CLASS>>[],
  GKA extends GearKit<InstanceType<CLASS>>,
  SKA extends ShellKit<InstanceType<CLASS>, BG>,
  XKA extends GateKit<InstanceType<CLASS>>,
> {
  readonly ResourceAtlas: CLASS;
  readonly locales: LL;
  readonly defaultLocale: LL[number];
  readonly load: ResModuleLoaderFn;
  // Compile-time validation via intersection with ValidBridgeGears:
  // rejects non-gear prefixes and reactive gears with branded error messages.
  // Runtime storage is the raw tuple (no runtime check — principle: type-first).
  readonly bridgeGears?: BG & ValidBridgeGears<InstanceType<CLASS>, BG>;
  readonly gearKit?: GKA;
  readonly shellKit?: SKA;
  readonly gateKit?: XKA;
}

export interface RMachineConfig<
  ATLAS extends AnyResAtlasInstance,
  L extends AnyLocale,
  K extends ResEquipment<ATLAS["res"], any, any, any, any>,
> {
  // Phantom type: carries the instance's rich type (gear/shell/res sub-maps)
  // for downstream generic threading. The runtime value stored here is the
  // atlas class itself (cast to the instance type) — nothing is instantiated.
  readonly resourceAtlas: ATLAS;
  readonly locales: LocaleList<L>;
  readonly defaultLocale: L;
  readonly load: ResModuleLoaderFn;
  // Extracted once from the atlas class's static `layout`. Kept as a dedicated
  // field for runtime access (path resolver, family classification) without
  // needing to read through the phantom `resourceAtlas` at runtime.
  readonly layout: AnyResLayout;
  // The bundled namespace-wiring info (kits + bridgeGears).
  readonly kit: K;
}

export function convertParamsToConfig<
  CLASS extends AnyResAtlasClass,
  LL extends AnyLocaleList,
  BG extends readonly BridgeGearNamespace<InstanceType<CLASS>>[],
  GKA extends GearKit<InstanceType<CLASS>>,
  SKA extends ShellKit<InstanceType<CLASS>, BG>,
  XKA extends GateKit<InstanceType<CLASS>>,
>(
  params: RMachineConfigParams<CLASS, LL, BG, GKA, SKA, XKA>
): RMachineConfig<InstanceType<CLASS>, LL[number], ResEquipment<InstanceType<CLASS>["res"], GKA, SKA, XKA, BG>> {
  return {
    // Runtime value: the class reference. Type-level: the instance (phantom).
    // The cast is safe because nothing reads runtime fields off this — access
    // goes through `layout` below or through per-resource resolution.
    resourceAtlas: params.ResourceAtlas as unknown as InstanceType<CLASS>,
    locales: [...params.locales],
    defaultLocale: params.defaultLocale,
    load: params.load,
    layout: params.ResourceAtlas.layout,
    kit: {
      gear: params.gearKit ?? ({} as GKA),
      shell: params.shellKit ?? ({} as SKA),
      gate: params.gateKit ?? ({} as XKA),
      bridgeGears: (params.bridgeGears ?? ([] as readonly unknown[])) as BG,
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
    kit: {
      gear: { ...config.kit.gear },
      shell: { ...config.kit.shell },
      gate: { ...config.kit.gate },
      bridgeGears: Object.freeze([...config.kit.bridgeGears]) as C["kit"]["bridgeGears"],
    },
  };
}
