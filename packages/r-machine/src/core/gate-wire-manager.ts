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

import type { AnyLocale } from "#r-machine/locale";
import type { GateWire } from "./gate-wire.js";
import type { JunctureManager } from "./juncture-manager.js";
import type { AnyNamespaceCollection } from "./res-domain.js";
import type { VertexGearMap } from "./vertex-gear.js";

// Unique id across all GateWireManager instances
let nextGenId = 0;

export class GateWireManager {
  constructor(protected readonly junctureManager: JunctureManager) {}

  getWire(nsDeps: AnyNamespaceCollection, locale: AnyLocale, vertexGearMap?: VertexGearMap | undefined): GateWire {
    return createGateWire(this.junctureManager, nsDeps, locale, vertexGearMap, ++nextGenId);
  }
}

function createGateWire(
  junctureManager: JunctureManager,
  nsDeps: AnyNamespaceCollection,
  locale: AnyLocale,
  vertexGearMap: VertexGearMap | undefined,
  genId: number
): GateWire {
  let currentLocale = locale;
  let currentVertexGearMap = vertexGearMap;
  let currentPluginPromise = junctureManager.getPlugin(
    "gate",
    nsDeps,
    currentLocale,
    undefined,
    genId,
    currentVertexGearMap
  );
  const subscribers = new Set<() => void>();

  return {
    getPluginPromise: () => currentPluginPromise,

    subscribe: (callback: () => void) => {
      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          junctureManager.disposeVertexJunctures(genId);
        }
      };
    },
    // TODO: WIP — concurrent-rendering tracking (next slice)
    startTracking: () => () => {},

    updateRequest: (newLocale: AnyLocale, newVertexGearMap?: VertexGearMap | undefined) => {
      // TODO: race "updateRequest while pluginPromise still in flight"
      const localeChanged = newLocale !== currentLocale;
      const vertexGearMapChanged = newVertexGearMap !== currentVertexGearMap;
      if (!localeChanged && !vertexGearMapChanged) {
        return;
      }
      if (vertexGearMapChanged) {
        junctureManager.disposeVertexJuncturesByOwnershipChange(genId, newVertexGearMap);
        currentVertexGearMap = newVertexGearMap;
      }
      if (localeChanged) {
        currentLocale = newLocale;
      }

      currentPluginPromise = junctureManager.getPlugin(
        "gate",
        nsDeps,
        currentLocale,
        undefined,
        genId,
        currentVertexGearMap
      );

      for (const cb of subscribers) {
        try {
          cb();
        } catch (e) {
          console.error(e);
        }
      }
    },
  };
}
