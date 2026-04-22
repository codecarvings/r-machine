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

import type { AnyResAtlas } from "#r-machine/core";
import type { AnyLocale } from "#r-machine/locale";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import type { VertexGearMap } from "./vertex-gear.js";

export interface GateWire {
  readonly getPlugin: () => unknown | Promise<unknown>;
  readonly subscribe: (callback: () => void) => () => void;
  readonly commitTracking: () => void;
  readonly updateRequest: (locale: AnyLocale, vertexGearMap?: VertexGearMap | undefined) => void;
}

export type GateWireConnector = (locale: AnyLocale, vertexGearMap?: VertexGearMap | undefined) => GateWire;

export type GateWireProvider = (deps: HandleMap<AnyResAtlas> | HandleList<AnyResAtlas>) => GateWireConnector;
