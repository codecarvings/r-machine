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
  type HandleList,
  KernelManager,
  type ResEquipment,
  type ResWireProvider,
  type ShellKit,
  type SurfaceList,
  type VertexGearMap,
} from "#r-machine/core";
import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "#r-machine/errors";
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
    this.kernelManager = new KernelManager(resLayoutEntryTypeResolver, blueprintManager);
  }

  readonly locales: LocaleList<L>;
  readonly defaultLocale: L;
  readonly localeHelper: LocaleHelper<L>;
  protected readonly config: RMachineConfig<RA, L, E>;
  protected readonly kernelManager: KernelManager;

  protected validateLocaleForPick(locale: L) {
    const error = this.localeHelper.validateLocale(locale);
    if (error) {
      throw new RMachineUsageError(ERR_UNKNOWN_LOCALE, `Cannot use invalid locale: "${locale}".`, error);
    }
  }

  createToolset(): RMachineToolset<RA, L, E> {
    const provider: ResWireProvider = () => () => ({
      getPlugin: () => {
        throw new Error("ResWire resolution not yet implemented (engine WIP).");
      },
    });
    const Gear = createGearComposer<RA, E["gearKit"]>(provider);
    const Shell = createShellComposer<RA, L, E["bridgeGears"], E["shellKit"]>(provider);
    return { Gear, Shell, localized };
  }

  getGateWire(_plugHead: AnyPlugHead, _locale: L, _vertexGearMap?: VertexGearMap | undefined): GateWire {
    return undefined!; // TODO: WIP;
  }

  async WIP_GET<DL extends HandleList<RA>>(...deps: DL): Promise<SurfaceList<RA, DL>> {
    if (deps.length > 0) {
      const blueprint = await this.kernelManager.getKernel(deps[0] as any, this.defaultLocale);
      console.log("WIP_GET loaded blueprint:", blueprint);
    }
    return undefined!;
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
