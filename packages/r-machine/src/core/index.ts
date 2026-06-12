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

export type { Action, RuntimeAction } from "./action.js";
export { type BaseGearComposer, createBaseGearComposer } from "./base-gear-composer.js";
export type { BaseGearNamespaceList } from "./base-gear-plug.js";
export { BlueprintManager } from "./blueprint-manager.js";
export type { SwitchableOption } from "./config-options.js";
export { type DeepPartial, deepPartialMerge } from "./deep-partial.js";
export { isDevEnv } from "./dev-env.js";
export {
  type BlueprintEvent,
  BUS_ACCESSOR,
  type BusBridge,
  type BusHost,
  createEventBus,
  type InternalEvent,
  type InternalEventBus,
  type ResEvent,
  type WireEvent,
} from "./event-bus.js";
export type { ExperimentalFlags } from "./experimental-flags.js";
export type {
  GateListPlugHead,
  GateMapPlugHead,
  GatePluginCtx,
} from "./gate-plug.js";
export type { GearPlugKitMap } from "./gear-plug.js";
export type { Getter } from "./getter.js";
export { createInnerGearComposer, type InnerGearComposer } from "./inner-gear-composer.js";
export { getMemberName } from "./member-name.js";
export { createOuterGearComposer, type OuterGearComposer } from "./outer-gear-composer.js";
export {
  type AnyListPlugHead,
  type AnyMapPlugHead,
  type AnyPlugHead,
  createPlug,
  type ExtractCtx,
  type ExtractKit,
  type ExtractResAtlas,
  type ExtractState,
  getPlugHead,
  getPlugId,
  getPlugMachine,
  getPlugOutline,
  getPlugOverride,
  getPlugResolve,
  type ListPlugin,
  type MapPlugin,
  PLUG_MACHINE_ACCESSOR,
  type PlugBody,
  type PluginCtxAugmenter,
  type PlugMachine,
  type PlugMachineBridge,
  type PlugMode,
  type PlugOverride,
  type PlugResolve,
  setPlugMachine,
  setPlugOverride,
  setPlugResolve,
} from "./plug.js";
export type { Cassette, CassetteRecorder, ReadableCell } from "./reactivity/cassette-recorder.js";
export { createCassetteRecorder } from "./reactivity/cassette-recorder.js";
export type { StateCell } from "./reactivity/state-cell.js";
export type { RelayBrand } from "./relay.js";
export type { AnyRes, AnyResOrigin } from "./res.js";
export type {
  AnyResAtlas,
  AnyResAtlasClass,
  ResAtlas,
  ResAtlasClass,
} from "./res-atlas.js";
export type { ResComposerConnector } from "./res-composer-connector.js";
export type { Handle, NamespaceCollection } from "./res-domain.js";
export {
  type AnyNamespace,
  type AnyNamespaceCollection,
  type AnyResDomain,
  createToken,
  type ExtractNamespace,
  type Namespace,
  type Token,
} from "./res-domain.js";
export type {
  AnyResEquipment,
  ResEquipment,
} from "./res-equipment.js";
export {
  type AnyResLayout,
  isOuterGearLayoutType,
  isVertexGearLayoutType,
  type ResLayoutEntryType,
  ResLayoutResolver,
  type ResolveLayoutType,
} from "./res-layout.js";
export {
  type AnyNamespaceList,
  getNamespaceList,
  type HandleList,
  isNamespaceList,
  type NamespaceList,
  type SurfaceList,
  type ValidatedDepListType,
} from "./res-list.js";
export { ResManager } from "./res-manager.js";
export {
  type AnyNamespaceMap,
  getNamespaceMap,
  type HandleMap,
  type NamespaceMap,
  type SurfaceMap,
  type ValidatedDepMapType,
} from "./res-map.js";
export type { ResMatrix } from "./res-matrix.js";
export {
  type AnyResModule,
  type ResModuleLoaderFn,
  type ResModuleLoaderFnOptions,
  validateResModule,
} from "./res-module.js";
export { attachResolveContext, getResolveContext, type ResolveContext } from "./resolve-context.js";
export {
  createRequestScope,
  PROCESS_SCOPE_PROVIDER,
  type RequestScope,
  type RequestScopeProvider,
  type Slot,
} from "./scope.js";
export { createShellComposer, type ShellComposer } from "./shell-composer.js";
export type { ShellPlugKitMap } from "./shell-plug.js";
export { type RState, type StatefulOuterStateMap, setStateAccess, tryGetStateAccess } from "./state.js";
export type { AnyClientGearSurface, AnySurface, Surface } from "./surface.js";
export { ASYNC, fulfilledThenable, type MaybeAsync } from "./sync-resolve.js";
export { TestMode } from "./test-mode.js";
export {
  buildVertexKey,
  tryGetVertexGearTag,
  type VertexGearMap,
  type VertexGearTagData,
} from "./vertex-gear.js";
export type { Wire } from "./wire.js";
export { WireManager } from "./wire-manager.js";
