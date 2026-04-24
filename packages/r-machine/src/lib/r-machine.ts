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
  type AnyNamespaceCollection,
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
  type ResComposerConnector,
  type ResEquipment,
  type ResFamily,
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
    const blueprintManager = new BlueprintManager(
      resLayoutEntryTypeResolver,
      {
        gear: Object.values(this.config.equipment.gearKit),
        shell: Object.values(this.config.equipment.shellKit),
      },
      this.config.load
    );
    this.kernelManager = new KernelManager(resLayoutEntryTypeResolver, this.config.equipment, blueprintManager);
  }

  readonly locales: LocaleList<L>;
  readonly defaultLocale: L;
  readonly localeHelper: LocaleHelper<L>;
  protected readonly config: RMachineConfig<RA, L, E>;
  protected readonly kernelManager: KernelManager;

  /*
  protected validateLocaleForPick(locale: L) {
    const error = this.localeHelper.validateLocale(locale);
    if (error) {
      throw new RMachineUsageError(ERR_UNKNOWN_LOCALE, `Cannot use invalid locale: "${locale}".`, error);
    }
  }
  */

  protected createResComposerConnector(family: ResFamily): ResComposerConnector {
    return {
      getWire: async (deps, locale, selfNamespace) => {
        const plugin = await this.kernelManager.getPlugin(family, deps, locale, selfNamespace);
        return {
          plugin,
        };
      },
    };
  }

  createToolset(): RMachineToolset<RA, L, E> {
    const Gear = createGearComposer<RA, E["gearKit"]>(this.createResComposerConnector("gear"));
    const Shell = createShellComposer<RA, L, E["bridgeGears"], E["shellKit"]>(this.createResComposerConnector("shell"));
    return { Gear, Shell, localized };
  }

  getGateWire(_plugHead: AnyPlugHead, _locale: L, _vertexGearMap?: VertexGearMap | undefined): GateWire {
    return undefined!; // TODO: WIP;
  }

  async WIP_GET<DL extends HandleList<RA>>(deps: DL): Promise<SurfaceList<RA, DL>> {
    const isList = isNamespaceList(deps as any);
    let nsDeps: AnyNamespaceCollection;
    if (isList) {
      nsDeps = getNamespaceList(deps);
    } else {
      nsDeps = getNamespaceList(deps);
    }

    const result = await this.kernelManager.getPlugin("gate", nsDeps, this.defaultLocale, undefined);
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
