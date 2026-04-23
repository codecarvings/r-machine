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
  type AnyNamespace,
  type AnyNamespaceList,
  type AnyNamespaceMap,
  type AnyPlugHead,
  type AnyRes,
  type AnyResAtlas,
  type AnyResAtlasClass,
  type AnyResEquipment,
  BlueprintManager,
  type BridgeGearNamespaceList,
  createGearComposer,
  createResLayoutEntryTypeResolver,
  createShellComposer,
  type GateKit,
  type GateWire,
  type GearKit,
  getNamespaceList,
  type HandleList,
  isNamespaceList,
  KernelManager,
  KernelPluginManager,
  type ResEquipment,
  type ResFamily,
  type ResWireProvider,
  type ShellKit,
  type SurfaceList,
  type VertexGearMap,
} from "#r-machine/core";
import type { AnyLocale, AnyLocaleList, LocaleList } from "#r-machine/locale";
import { LocaleHelper } from "#r-machine/locale";
import {
  cloneRMachineConfig,
  convertParamsToConfig,
  type RMachineConfig,
  type RMachineConfigParams,
  validateRMachineConfig,
} from "./r-machine-config.js";
import type { RMachineToolset } from "./r-machine-toolset.js";

export class RMachine<RA extends AnyResAtlas, L extends AnyLocale, E extends AnyResEquipment<RA>> {
  constructor(config: RMachineConfig<RA, L, E>) {
    const configError = validateRMachineConfig(config);
    if (configError) {
      throw configError;
    }
    this.config = cloneRMachineConfig(config);
    this.locales = this.config.locales;
    this.defaultLocale = this.config.defaultLocale;
    this.localeHelper = new LocaleHelper(this.config.locales, this.config.defaultLocale);

    const resLayoutEntryTypeResolver = createResLayoutEntryTypeResolver(this.config.layout);
    const blueprintManager = new BlueprintManager(this.config.load);
    const kernelManager = new KernelManager(resLayoutEntryTypeResolver, blueprintManager);
    this.kernelPluginManager = new KernelPluginManager(this.config.equipment, kernelManager);
  }

  readonly locales: LocaleList<L>;
  readonly defaultLocale: L;
  readonly localeHelper: LocaleHelper<L>;
  protected readonly config: RMachineConfig<RA, L, E>;
  protected readonly kernelPluginManager: KernelPluginManager;

  /*
  protected validateLocaleForPick(locale: L) {
    const error = this.localeHelper.validateLocale(locale);
    if (error) {
      throw new RMachineUsageError(ERR_UNKNOWN_LOCALE, `Cannot use invalid locale: "${locale}".`, error);
    }
  }
  */

  protected createResWireProvider(family: ResFamily): ResWireProvider {
    return (deps, locale) => {
      const plugin = this.kernelPluginManager.getPluginSync(family, deps, locale);
      return {
        plugin,
      };
    };
  }

  createToolset(): RMachineToolset<RA, L, E> {
    const Gear = createGearComposer<RA, E["gearKit"]>(this.createResWireProvider("gear"));
    const Shell = createShellComposer<RA, L, E["bridgeGears"], E["shellKit"]>(this.createResWireProvider("shell"));
    return { Gear, Shell, localized };
  }

  getGateWire(_plugHead: AnyPlugHead, _locale: L, _vertexGearMap?: VertexGearMap | undefined): GateWire {
    return undefined!; // TODO: WIP;
  }

  async WIP_GET<DL extends HandleList<RA>>(deps: DL): Promise<SurfaceList<RA, DL>> {
    const isList = isNamespaceList(deps);
    let nsDeps: AnyNamespaceMap | AnyNamespaceList;
    if (isList) {
      nsDeps = getNamespaceList(deps);
    } else {
      nsDeps = getNamespaceList(deps);
    }

    const result = await this.kernelPluginManager.getPlugin("gate", nsDeps, this.defaultLocale);
    console.log("WIP_GET loaded blueprint:", result);
    return result as SurfaceList<RA, DL>;
  }

  static create<
    RAC extends AnyResAtlasClass,
    const LL extends AnyLocaleList,
    const BGL extends BridgeGearNamespaceList<InstanceType<RAC>> = [],
    GK extends GearKit<InstanceType<RAC>> = {},
    SK extends ShellKit<InstanceType<RAC>, BGL> = {},
    XK extends GateKit<InstanceType<RAC>> = {},
  >(
    config: RMachineConfigParams<RAC, LL, BGL, GK, SK, XK>
  ): RMachine<InstanceType<RAC>, LL[number], ResEquipment<InstanceType<RAC>, BGL, GK, SK, XK>> {
    return new RMachine<InstanceType<RAC>, LL[number], ResEquipment<InstanceType<RAC>, BGL, GK, SK, XK>>(
      convertParamsToConfig(config)
    );
  }
}

export type RMachineLocale<RM extends RMachine<any, any, any>> = RM extends RMachine<any, infer L, any> ? L : never;

function localized<S extends AnyRes>(_namespace: AnyNamespace, shell: S): S {
  return shell;
}
