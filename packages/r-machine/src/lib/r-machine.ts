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
  type AnyPlugHead,
  type AnyRes,
  type AnyResAtlas,
  createForge,
  type ExplicitNamespaceMap,
  type GateWire,
  type ResKit,
  type VertexGearMap,
} from "#r-machine/core";
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

export class RMachine<RA extends AnyResAtlas, L extends AnyLocale, KA extends ResKit<RA>> {
  constructor(config: RMachineConfig<RA, L, KA>) {
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
  protected readonly config: RMachineConfig<RA, L, KA>;

  protected validateLocaleForPick(locale: L) {
    const error = this.localeHelper.validateLocale(locale);
    if (error) {
      throw new RMachineUsageError(ERR_UNKNOWN_LOCALE, `Cannot use invalid locale: "${locale}".`, error);
    }
  }

  createToolset(): RMachineToolset<RA, L, KA> {
    const Forge = createForge<RA, L, KA>();
    return { Forge, localized: localized };
  }

  getGateWire(_plugHead: AnyPlugHead, _locale: L, _vertexGearMap?: VertexGearMap | undefined): GateWire {
    return undefined!; // TODO: WIP;
  }

  // KA not "const KA" for DX purposes
  static create<
    RA extends AnyResAtlas,
    const LL extends AnyLocaleList,
    GKA extends ExplicitNamespaceMap<RA> = {},
    SKA extends ExplicitNamespaceMap<RA> = {},
    XKA extends ExplicitNamespaceMap<RA> = {},
  >(config: RMachineConfigParams<RA, LL, GKA, SKA, XKA>): RMachine<RA, LL[number], ResKit<RA, GKA, SKA, XKA>> {
    return new RMachine<RA, LL[number], ResKit<RA, GKA, SKA, XKA>>(convertParamsToConfig(config));
  }
}

export type RMachineLocale<RM extends RMachine<any, any, any>> = RM extends RMachine<any, infer L, any> ? L : never;

function localized<S extends AnyRes>(_namespace: AnyNamespace, shell: S): S {
  return shell;
}
