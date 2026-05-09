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
  type AnyNamespaceMap,
  type AnyRes,
  type AnyResAtlas,
  type AnyResAtlasClass,
  type AnyResEquipment,
  type BaseGearNamespaceList,
  BlueprintManager,
  createBaseGearComposer,
  createInnerGearComposer,
  createOuterGearComposer,
  createShellComposer,
  type ExperimentalFlags,
  type GateWire,
  GateWireManager,
  type GearPlugKitMap,
  getNamespaceList,
  type HandleList,
  isNamespaceList,
  JunctureManager,
  type NamespaceMap,
  type PluginCtxAugmenter,
  type ResComposerConnector,
  type ResEquipment,
  ResLayoutResolver,
  type ShellPlugKitMap,
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

export class RMachine<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends AnyResEquipment<RA>,
  EF extends ExperimentalFlags,
> {
  protected constructor(config: RMachineConfig<RA, L, E, EF>) {
    const configError = validateRMachineConfig(config);
    if (configError) {
      throw configError;
    }
    this.config = cloneRMachineConfig(config);
    this.locales = this.config.locales;
    this.defaultLocale = this.config.defaultLocale;
    this.localeHelper = new LocaleHelper(this.config.locales, this.config.defaultLocale);

    const resLayoutResolver = new ResLayoutResolver(this.config.layout);
    const blueprintManager = new BlueprintManager(
      resLayoutResolver,
      this.config.load,
      {
        gear: Object.values(this.config.equipment.gearKit),
        shell: Object.values(this.config.equipment.shellKit),
      },
      this.config.priority
    );
    this.junctureManager = new JunctureManager(resLayoutResolver, this.config.equipment, blueprintManager);
    this.gateWireManager = new GateWireManager(this.junctureManager);

    this.warnExperimental();
  }

  protected warnExperimental() {
    const display = (feature: string) =>
      console.warn(`R-Machine: ${feature} (experimental). API may change before stable release.`);

    if (this.config.experimental.outerGear === "on") {
      display("Outer Gear is enabled");
    }
  }

  readonly locales: LocaleList<L>;
  readonly defaultLocale: L;
  readonly localeHelper: LocaleHelper<L>;
  protected readonly config: RMachineConfig<RA, L, E, EF>;
  protected readonly junctureManager: JunctureManager;
  protected readonly gateWireManager: GateWireManager;

  /*
  protected validateLocaleForPick(locale: L) {
    const error = this.localeHelper.validateLocale(locale);
    if (error) {
      throw new RMachineUsageError(ERR_UNKNOWN_LOCALE, `Cannot use invalid locale: "${locale}".`, error);
    }
  }
  */

  protected createResComposerConnector(kit: AnyNamespaceMap): ResComposerConnector {
    return {
      getWire: async (deps, locale, augmentCtx, chain) => {
        const plugin = await this.junctureManager.getPlugin(kit, deps, locale, augmentCtx, chain, 0, undefined);
        return {
          plugin,
        };
      },
    };
  }

  createToolset(): RMachineToolset<RA, L, E, EF> {
    const InnerGear = createInnerGearComposer<RA, E["gearKit"]>(
      this.createResComposerConnector(this.config.equipment.gearKit)
    );
    const BaseGear = createBaseGearComposer<RA, E["gearKit"]>(
      this.createResComposerConnector(this.config.equipment.gearKit)
    );
    const OuterGear =
      this.config.experimental.outerGear === "on"
        ? createOuterGearComposer<RA, E["gearKit"]>(this.createResComposerConnector(this.config.equipment.gearKit))
        : undefined!;
    const Shell = createShellComposer<RA, L, E["bridgeGears"], E["shellKit"]>(
      this.createResComposerConnector(this.config.equipment.shellKit)
    );
    return { InnerGear, BaseGear, OuterGear, Shell, localized };
  }

  getGateWire(
    kit: AnyNamespaceMap,
    nsDeps: AnyNamespaceCollection,
    locale: AnyLocale,
    augmentCtx: PluginCtxAugmenter,
    vertexGearMap?: VertexGearMap | undefined
  ): GateWire {
    return this.gateWireManager.getWire(kit, nsDeps, locale, augmentCtx, vertexGearMap);
  }

  async WIP_GET<DL extends HandleList<RA>>(kit: NamespaceMap<RA>, deps: DL, locale: L): Promise<SurfaceList<RA, DL>> {
    const isList = isNamespaceList(deps as any);
    let nsDeps: AnyNamespaceCollection;
    if (isList) {
      nsDeps = getNamespaceList(deps);
    } else {
      nsDeps = getNamespaceList(deps);
    }

    const result = await this.junctureManager.getPlugin(
      kit,
      nsDeps,
      locale,
      ($) => {
        $.locale = locale;
      },
      [],
      0,
      undefined
    );
    return result as SurfaceList<RA, DL>;
  }

  static create<
    RAC extends AnyResAtlasClass,
    const LL extends AnyLocaleList,
    const BGL extends BaseGearNamespaceList<InstanceType<RAC>> = [],
    GK extends GearPlugKitMap<InstanceType<RAC>> = {},
    SK extends ShellPlugKitMap<InstanceType<RAC>, BGL> = {},
    EF extends ExperimentalFlags = {},
  >(
    config: RMachineConfigParams<RAC, LL, BGL, GK, SK, EF>
  ): RMachine<InstanceType<RAC>, LL[number], ResEquipment<InstanceType<RAC>, BGL, GK, SK>, EF> {
    return new RMachine<InstanceType<RAC>, LL[number], ResEquipment<InstanceType<RAC>, BGL, GK, SK>, EF>(
      convertParamsToConfig(config)
    );
  }
}

export type RMachineLocale<RM extends RMachine<any, any, any, any>> =
  RM extends RMachine<any, infer L, any, any> ? L : never;

function localized<S extends AnyRes>(_namespace: AnyNamespace, shell: S): S {
  return shell;
}
