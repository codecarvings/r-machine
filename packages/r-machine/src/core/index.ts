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

export type { Action, Atomic } from "./action.js";
export type {
  GateListPlugHead,
  GateMapPlugHead,
  GatePluginCtx,
} from "./gate-plug.js";
export type { GateWire } from "./gate-wire.js";
export type { GearComposer } from "./gear-composer.js";
export type { Getter } from "./getter.js";
export {
  type AnyListPlugHead,
  type AnyMapPlugHead,
  type AnyPlugHead,
  type ExtractCtx,
  type ExtractKit,
  type ExtractResAtlas,
  getPlugHead,
  getPlugResolve,
  type ListPlugin,
  type MapPlugin,
  type PlugBody,
  type PlugMode,
  setPlugResolve,
} from "./plug.js";
export type { ReactiveGearTag } from "./reactive-gear.js";
export type { RelayBrand } from "./relay.js";
export type { AnyRes, AnyResOrigin } from "./res.js";
export { type AnyResAtlas, createToken, type ExtractNamespace, type Namespace, type Token } from "./res-atlas.js";
export type { ResKit } from "./res-kit.js";
export type { AnyResLayout, ResLayoutEntryType, ResolveLayoutType } from "./res-layout.js";
export type { NamespaceList, SolidNamespaceList, SurfaceList } from "./res-list.js";
export type {
  ExplicitNamespaceMap,
  NamespaceMap,
  SolidNamespaceMap,
  SurfaceMap,
} from "./res-map.js";
export type { ResMatrix } from "./res-matrix.js";
export type { ResModuleLoaderFn } from "./res-module.js";
export type { ShellTag } from "./shell.js";
export type { ShellComposer } from "./shell-composer.js";
export type { Surface } from "./surface.js";
export {
  type AnyVertexGear,
  getVertexGearTag,
  type VertexGearMap,
  type VertexGearTag,
  type VertexGearTagData,
} from "./vertex-gear.js";
