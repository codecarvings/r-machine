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

import { isGetter } from "./getter.js";
import { isRelay } from "./relay.js";
import type { AnyRes } from "./res.js";
import type { AnyResolvedNamespaceMap } from "./res-map.js";
import { setStateAccess, tryGetStateAccess } from "./state.js";
import type { AnySurface } from "./surface.js";
import { setVertexGearTag, type VertexGearTagData } from "./vertex-gear.js";

export interface ResPod {
  readonly res: AnyRes;
  readonly surface: AnySurface;
}

function buildSurface(res: AnyRes, vertexTag: VertexGearTagData | undefined): AnySurface {
  const surface = Object.create(null) as AnyResolvedNamespaceMap;
  for (const key of Object.keys(res)) {
    if (key.startsWith("$")) {
      continue;
    }
    const entry = (res as AnyResolvedNamespaceMap)[key];
    // Relay items are wiring, not consumer-facing values — excluded from the surface.
    if (isRelay(entry)) {
      continue;
    }
    if (isGetter(entry)) {
      Object.defineProperty(surface, key, {
        enumerable: true,
        configurable: false,
        get: entry,
      });
    } else {
      Object.defineProperty(surface, key, {
        enumerable: true,
        configurable: false,
        writable: false,
        value: entry,
      });
    }
  }
  if (vertexTag !== undefined) {
    setVertexGearTag(surface as AnyRes, vertexTag);
  }
  // Carry the stateful OuterGear's live cell from `res` onto the surface (the
  // surface strips `$`, where the cell otherwise lives) so the `mockPlug`
  // controller can reach a dependency's state. For a vertex gear this is the
  // per-instance cell, so a consumer binds to the exact instance it received.
  const stateCell = tryGetStateAccess(res);
  if (stateCell !== undefined) {
    setStateAccess(surface, stateCell);
  }
  return surface;
}

export function buildResPod(res: AnyRes, vertexTag: VertexGearTagData | undefined): ResPod {
  return { res, surface: buildSurface(res, vertexTag) };
}
