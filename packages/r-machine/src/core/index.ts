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

export type { Atomic } from "./action.js";
export type { GateWire, VertexMap } from "./engine/gate-wire.js";
export type { Forge } from "./forge.js";
export type {
  GateListPlug,
  GateListPlugin,
  GateMapPlug,
  GateMapPlugin,
  GatePlugComposer,
  GatePlugHead,
  GatePluginCtx,
} from "./gate-plug.js";
export {
  type AnyListPlugHead,
  type AnyMapPlugHead,
  type AnyPlugHead,
  type ExtractCtx,
  type ExtractResAtlas,
  type LocaleAwarePluginCtx,
  type PlugBody,
  type PlugHead,
  type PlugMode,
  plugHeadSymbol,
  plugResolveSymbol,
} from "./plug.js";
export type { AnyRes, AnyResOrigin } from "./res.js";
export { type AnyResAtlas, type Namespace, namespaceSymbol, type Token } from "./res-atlas.js";
export type { ResKit } from "./res-kit.js";
export type { NamespaceList, SurfaceList } from "./res-list.js";
export type { ExplicitNamespaceMap, NamespaceMap, PartialSurfaceMap, SurfaceMap } from "./res-map.js";
export type { ResMatrix } from "./res-matrix.js";
export type { ResModuleLoaderFn } from "./res-module.js";
export type { Surface } from "./surface.js";
