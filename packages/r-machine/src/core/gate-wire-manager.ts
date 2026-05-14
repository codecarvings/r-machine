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
import type { BusHost } from "./event-bus.js";
import type { GateWire } from "./gate-wire.js";
import type { JunctureManager } from "./juncture-manager.js";
import type { PluginCtxAugmenter } from "./plug.js";
import type { CassetteRecorder } from "./reactivity/cassette-recorder.js";
import type { AnyNamespace, AnyNamespaceCollection } from "./res-domain.js";
import { isNamespaceList } from "./res-list.js";
import type { AnyNamespaceMap } from "./res-map.js";
import type { VertexGearMap } from "./vertex-gear.js";

// Unique id across all GateWireManager instances
let nextGenId = 0;

export class GateWireManager {
  constructor(
    protected readonly junctureManager: JunctureManager,
    protected readonly busHost: BusHost,
    protected readonly recorder: CassetteRecorder
  ) {}

  getWire(
    kit: AnyNamespaceMap,
    nsDeps: AnyNamespaceCollection,
    locale: AnyLocale,
    augmentCtx: PluginCtxAugmenter,
    vertexGearMap?: VertexGearMap | undefined
  ): GateWire {
    return createGateWire(
      this.junctureManager,
      kit,
      nsDeps,
      locale,
      augmentCtx,
      vertexGearMap,
      ++nextGenId,
      this.busHost,
      this.recorder
    );
  }
}

function createGateWire(
  junctureManager: JunctureManager,
  kit: AnyNamespaceMap,
  nsDeps: AnyNamespaceCollection,
  locale: AnyLocale,
  augmentCtx: PluginCtxAugmenter,
  vertexGearMap: VertexGearMap | undefined,
  genId: number,
  busHost: BusHost,
  recorder: CassetteRecorder
): GateWire {
  let currentLocale = locale;
  let currentVertexGearMap = vertexGearMap;
  // Start dirty so the initial getPluginPromise() triggers a resolve.
  // No work is done at creation time — keeps createGateWire pure-ish so
  // Strict Mode's double lazy-init is harmless.
  let dirty = true;
  let currentPluginPromise: Promise<unknown> | null = null;

  const topLevelNs: AnyNamespace[] = isNamespaceList(nsDeps) ? [...nsDeps] : Object.values(nsDeps);

  const subscribers = new Set<() => void>();
  // Lazy: subscribe to JM only when the first external subscriber arrives.
  // Disposed when the last one leaves. This keeps short-lived "ghost" wires
  // (Strict Mode duplicates, abandoned mounts) from leaking JM subscriptions.
  let unsubFromJm: (() => void) | null = null;

  // Cassette-side tracking: deps collected during a consumer's render and
  // subscribed at commit. Replaced on each re-commit; cleared on wire disposal.
  let cassetteUnsubs: Array<() => void> = [];
  // One persistent Cassette for this wire — insert clears prior deps; eject is
  // idempotent. `trackingEpoch` lets commit closures detect supersedure: a
  // new startTracking() before commit (Strict Mode double-invoke, abandoned
  // render) bumps the epoch, so the prior commit closure becomes a no-op.
  const cassette = recorder.createCassette();
  let trackingEpoch = 0;

  function clearCassetteSubs(): void {
    for (const unsub of cassetteUnsubs) unsub();
    cassetteUnsubs = [];
  }

  function notifyFromCassette(): void {
    // Bust Promise identity without re-resolving: useSyncExternalStore's
    // `getSnapshot` returns a different reference, triggering a rerender,
    // but `await getPluginPromise()` resolves to the same underlying plugin.
    if (currentPluginPromise !== null) {
      currentPluginPromise = currentPluginPromise.then((p) => p);
    }
    busHost.bus?.emit({ type: "gateWire:cassetteNotified", genId, subscriberCount: subscribers.size });
    for (const cb of subscribers) {
      try {
        cb();
      } catch (e) {
        console.error(e);
      }
    }
  }

  function resolve() {
    busHost.bus?.emit({ type: "gateWire:resolveTriggered", genId });
    currentPluginPromise = junctureManager.getPlugin(
      kit,
      nsDeps,
      currentLocale,
      augmentCtx,
      [],
      genId,
      currentVertexGearMap
    );
    dirty = false;
  }

  busHost.bus?.emit({ type: "gateWire:created", genId, locale, topLevelNs: [...topLevelNs] });

  return {
    getPluginPromise: () => {
      if (dirty || currentPluginPromise === null) {
        resolve();
      }
      return currentPluginPromise as Promise<unknown>;
    },

    subscribe: (callback: () => void) => {
      if (subscribers.size === 0) {
        unsubFromJm = junctureManager.subscribe(topLevelNs, () => {
          dirty = true;
          busHost.bus?.emit({ type: "gateWire:markedDirty", genId, subscriberCount: subscribers.size });
          for (const cb of subscribers) {
            try {
              cb();
            } catch (e) {
              console.error(e);
            }
          }
        });
        busHost.bus?.emit({ type: "gateWire:jmSubscribed", genId });
      }
      subscribers.add(callback);
      busHost.bus?.emit({ type: "gateWire:subscribed", genId });
      return () => {
        subscribers.delete(callback);
        busHost.bus?.emit({ type: "gateWire:unsubscribed", genId });
        if (subscribers.size === 0 && unsubFromJm !== null) {
          unsubFromJm();
          unsubFromJm = null;
          clearCassetteSubs();
          cassette.eject();
          const vertexSlotsDisposed = junctureManager.disposeAllVertexSlotsByGenId(genId);
          busHost.bus?.emit({ type: "gateWire:jmUnsubscribed", genId, vertexSlotsDisposed });
        }
      };
    },
    // Open a Cassette that records every $.state / memo read until the
    // returned commit fn fires. Commit ejects the cassette, replaces the
    // prior cassette-deps subscriptions, and wires each collected dep to the
    // wire's cassette-notify path (subscribers fire, Promise identity busts,
    // no plugin re-resolve).
    startTracking: () => {
      // insert() is idempotent: if a prior startTracking didn't commit
      // (abandoned render under Strict Mode), insert() simply clears the stale
      // deps. Bump the epoch so the stale commit closure detects supersedure.
      cassette.insert();
      trackingEpoch++;
      const myEpoch = trackingEpoch;
      busHost.bus?.emit({ type: "gateWire:trackingStarted", genId });
      let committed = false;
      return () => {
        if (committed) return;
        if (myEpoch !== trackingEpoch) {
          // A newer startTracking superseded this one; do nothing.
          return;
        }
        committed = true;
        cassette.eject();
        clearCassetteSubs();
        const deps = cassette.getDeps();
        for (const dep of deps) {
          cassetteUnsubs.push(dep.subscribe(notifyFromCassette));
        }
        busHost.bus?.emit({ type: "gateWire:trackingCommitted", genId, depCount: deps.size });
      };
    },

    // Update the wire's locale and/or vertexGearMap
    updateRequest: (newLocale: AnyLocale, newVertexGearMap?: VertexGearMap | undefined) => {
      const localeChanged = newLocale !== currentLocale;
      const vertexGearMapChanged = newVertexGearMap !== currentVertexGearMap;
      if (!localeChanged && !vertexGearMapChanged) {
        return;
      }
      busHost.bus?.emit({ type: "gateWire:updateRequested", genId, localeChanged, vertexGearMapChanged });
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

      // Mark dirty; the actual resolve runs lazily on next getPluginPromise().
      dirty = true;
      busHost.bus?.emit({ type: "gateWire:markedDirty", genId, subscriberCount: subscribers.size });

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
