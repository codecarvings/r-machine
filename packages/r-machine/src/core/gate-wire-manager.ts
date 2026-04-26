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
import type { AnyNamespace, AnyNamespaceCollection } from "./res-domain.js";
import { isNamespaceList } from "./res-list.js";
import type { VertexGearMap } from "./vertex-gear.js";

// Unique id across all GateWireManager instances
let nextGenId = 0;

export class GateWireManager {
  constructor(protected readonly junctureManager: JunctureManager) {}

  getWire(
    kit: "clientGate" | "serverGate", // TODO: WIP
    nsDeps: AnyNamespaceCollection,
    locale: AnyLocale,
    vertexGearMap?: VertexGearMap | undefined
  ): GateWire {
    return createGateWire(this.junctureManager, kit, nsDeps, locale, vertexGearMap, ++nextGenId);
  }
}

function createGateWire(
  junctureManager: JunctureManager,
  kit: "clientGate" | "serverGate", // TODO: WIP
  nsDeps: AnyNamespaceCollection,
  locale: AnyLocale,
  vertexGearMap: VertexGearMap | undefined,
  genId: number
): GateWire {
  let currentLocale = locale;
  let currentVertexGearMap = vertexGearMap;
  let dirty = false;
  let currentPluginPromise = junctureManager.getPlugin(
    kit,
    nsDeps,
    currentLocale,
    undefined,
    genId,
    currentVertexGearMap
  );
  const subscribers = new Set<() => void>();

  // Subscribe to top-level namespaces only. Cascades from JM.invalidate(X)
  // always reach top-level dependents via reverseClosure, so subscribing to
  // transitive deps would be redundant.
  const topLevelNs: AnyNamespace[] = isNamespaceList(nsDeps) ? [...nsDeps] : Object.values(nsDeps);
  const unsubFromJm = junctureManager.subscribe(topLevelNs, () => {
    dirty = true;
    for (const cb of subscribers) {
      try {
        cb();
      } catch (e) {
        console.error(e);
      }
    }
  });

  function reresolve() {
    currentPluginPromise = junctureManager.getPlugin(
      kit,
      nsDeps,
      currentLocale,
      undefined,
      genId,
      currentVertexGearMap
    );
    dirty = false;
  }

  return {
    getPluginPromise: () => {
      if (dirty) {
        reresolve();
      }
      return currentPluginPromise;
    },

    subscribe: (callback: () => void) => {
      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          unsubFromJm();
          junctureManager.disposeAllVertexSlotsByGenId(genId);
        }
      };
    },
    // TODO: WIP — concurrent-rendering tracking (next slice)
    startTracking: () => () => {},

    updateRequest: (newLocale: AnyLocale, newVertexGearMap?: VertexGearMap | undefined) => {
      const localeChanged = newLocale !== currentLocale;
      const vertexGearMapChanged = newVertexGearMap !== currentVertexGearMap;
      if (!localeChanged && !vertexGearMapChanged) {
        return;
      }
      if (vertexGearMapChanged) {
        // Dispose only the vertex slots whose ownership has shifted to a
        // parent (newVertexGearMap[ns] now defined): the wire stops being
        // their creator. Vertex still owned survive.
        junctureManager.disposeVertexSlotsByOwnershipChange(genId, newVertexGearMap);
        currentVertexGearMap = newVertexGearMap;
      }
      if (localeChanged) {
        currentLocale = newLocale;
      }

      reresolve();

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
