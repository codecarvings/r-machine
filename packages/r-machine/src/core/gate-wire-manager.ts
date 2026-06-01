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

  // Per-consumer cassette tracking state. A wire is shared across all
  // consumers that resolve to the same (locale, vgmSig) cache key (see
  // [[project-wirecache-per-locale]]), so a single shared cassette + sub
  // list would mean each consumer's commit tears down every other
  // consumer's subscriptions, leaving only the last-committing consumer
  // wired up to cell publishes. We key cassette state by an opaque
  // consumer key (a useRef-held empty object on the React side) so each
  // consumer's render → commit cycle is independent of the others.
  //
  // The `trackingEpoch` is also per-consumer: a Suspense retry from
  // consumer A bumps A's epoch (superseding A's pending commit) without
  // touching B's, so a sibling consumer's commit isn't accidentally
  // discarded by an unrelated retry.
  interface ConsumerState {
    cassette: ReturnType<typeof recorder.createCassette>;
    unsubs: Array<() => void>;
    epoch: number;
  }
  const consumers = new Map<object, ConsumerState>();

  function getOrCreateConsumer(key: object): ConsumerState {
    let state = consumers.get(key);
    if (state === undefined) {
      state = { cassette: recorder.createCassette(), unsubs: [], epoch: 0 };
      consumers.set(key, state);
    }
    return state;
  }

  function disposeConsumerState(state: ConsumerState): void {
    state.cassette.eject();
    for (const unsub of state.unsubs) {
      unsub();
    }
    state.unsubs = [];
  }

  function disposeAllConsumers(): void {
    for (const state of consumers.values()) {
      disposeConsumerState(state);
    }
    consumers.clear();
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
      // Re-use an existing JM subscription if the prior teardown is still
      // pending in a microtask (Strict Mode / Suspense toggle case) — the
      // sub is still wired up, no need to register a second one and leak.
      if (subscribers.size === 0 && unsubFromJm === null) {
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
          // All teardown (JM subscription, cassette cell subs, vertex slots)
          // is deferred to a microtask. React's
          // subscribe → unsubscribe → subscribe dance happens in two flavors:
          //   - Strict Mode mount: deliberate test of cleanup correctness.
          //   - React 19 concurrent rendering: a Suspense fallback toggle
          //     (sibling suspends, transition retries, Activity hides) tears
          //     down and re-establishes useSyncExternalStore subscriptions
          //     mid-render — the consumer is still alive, just paused.
          //
          // A synchronous vertex-slot dispose in either case kills the slot's
          // setInterval/listeners and flips `dirty=true`, so the resubscribe
          // hits `getPluginPromise` → new promise → `use()` re-suspends →
          // fallback again → unsubscribe → dispose → infinite Suspense loop
          // (cell state never has time to advance, page stays blank).
          //
          // Deferring to a microtask lets a same-tick resubscribe short-
          // circuit: if `subscribers.size > 0` at microtask time, skip
          // everything (JM stays subscribed, cassette subs intact, vertex
          // slots alive). If no resubscribe arrives (real unmount / HMR),
          // the microtask runs and tears down.
          queueMicrotask(() => {
            if (subscribers.size > 0) {
              return;
            }
            unsubFromJm?.();
            unsubFromJm = null;
            disposeAllConsumers();
            const vertexSlotsDisposed = junctureManager.disposeAllVertexSlotsByGenId(genId);
            if (vertexSlotsDisposed > 0) {
              // Vertex slots created by this wire's prior resolves are gone,
              // so the cached `currentPluginPromise` references slots that no
              // longer exist. Mark dirty so the next getPluginPromise() is
              // forced to re-resolve and re-create the vertex slots.
              dirty = true;
            }
            busHost.bus?.emit({ type: "gateWire:jmUnsubscribed", genId, vertexSlotsDisposed });
          });
        }
      };
    },
    // Open this consumer's tracking cassette + return a commit fn. Cassette
    // state (deps, subs, epoch) is per-consumer (see `consumers` Map above)
    // so multiple consumers sharing this wire don't tear down each other's
    // subscriptions on commit. This channel is SEPARATE from the wire's
    // `subscribers` (which carries JM-driven plugin re-resolves) — a
    // cassette-tracked dep mutation does NOT bust the plugin Promise
    // identity, so React consumers reading via `use(pluginPromise)` are not
    // forced to re-suspend through the Suspense boundary on every state
    // change.
    startTracking: (notify: () => void, consumerKey: object) => {
      const state = getOrCreateConsumer(consumerKey);
      state.cassette.insert();
      state.epoch++;
      const myEpoch = state.epoch;
      busHost.bus?.emit({ type: "gateWire:trackingStarted", genId });
      let committed = false;
      return () => {
        if (committed) {
          return;
        }
        // Per-consumer epoch: a later startTracking from THIS consumer (e.g.
        // a Suspense retry of the same component) bumps the epoch and
        // supersedes this commit. Sibling consumers on the same wire have
        // their own epoch counters and aren't affected.
        if (myEpoch !== state.epoch) {
          return;
        }
        committed = true;
        state.cassette.eject();
        for (const unsub of state.unsubs) {
          unsub();
        }
        state.unsubs = [];
        const deps = state.cassette.getDeps();
        for (const dep of deps) {
          state.unsubs.push(dep.subscribe(notify));
        }
        busHost.bus?.emit({ type: "gateWire:trackingCommitted", genId, depCount: deps.size });
      };
    },

    // Tear down a single consumer's tracking state. Called by the consumer
    // on unmount (or when the active wire identity changes — e.g. a locale
    // switch routes the consumer to a different cached wire).
    disposeConsumer: (consumerKey: object) => {
      const state = consumers.get(consumerKey);
      if (state === undefined) {
        return;
      }
      disposeConsumerState(state);
      consumers.delete(consumerKey);
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

      // Defer subscriber notification. updateRequest is typically invoked
      // mid-render (a React consumer switching locale calls it from inside
      // its render function). Firing useSyncExternalStore's internal store-
      // changed callbacks synchronously here would scheduleUpdateOnFiber on
      // those subscribed components mid-render, which React flags as "Cannot
      // update a component while rendering a different component."
      // The current render already picks up the new plugin promise via
      // getPluginPromise (it sees dirty=true on the next getSnapshot read
      // and re-resolves), so React's tearing prevention is unaffected. The
      // deferred fire is for non-useSyncExternalStore subscribers (if any)
      // that don't poll getSnapshot every render.
      queueMicrotask(() => {
        for (const cb of subscribers) {
          try {
            cb();
          } catch (e) {
            console.error(e);
          }
        }
      });
    },
  };
}
