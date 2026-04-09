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

import type { ExplicitNamespaceMap } from "#r-machine/core";
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
import type { RModuleLoader } from "./r-module.js";
import type { AnyResourceAtlas } from "./resource-atlas.js";

// The generic parameter LL is used to ensure that the defaultLocale is one of the locales in the list
export interface RMachineConfigParams<
  RA extends AnyResourceAtlas,
  LL extends AnyLocaleList,
  GKA extends ExplicitNamespaceMap<RA>,
  SKA extends ExplicitNamespaceMap<RA>,
  XKA extends ExplicitNamespaceMap<RA>,
> {
  readonly resourceAtlas: RA;
  readonly locales: LL;
  readonly defaultLocale: LL[number];
  readonly load: RModuleLoader;
  readonly gearKit?: GKA;
  readonly shellKit?: SKA;
  readonly gateKit?: XKA;
}

export interface Kit<
  RA extends AnyResourceAtlas,
  GKA extends ExplicitNamespaceMap<RA> = {},
  SKA extends ExplicitNamespaceMap<RA> = {},
  XKA extends ExplicitNamespaceMap<RA> = {},
> {
  readonly gear: GKA;
  readonly shell: SKA;
  readonly gate: XKA;
}

export interface RMachineConfig<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends Kit<RA, any, any, any>> {
  readonly resourceAtlas: RA;
  readonly locales: LocaleList<L>;
  readonly defaultLocale: L;
  readonly load: RModuleLoader;
  readonly kit: KA;
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
  };
}
