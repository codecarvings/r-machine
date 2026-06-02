/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/react, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

"use client";

// THIS IS THE BARE TOOLSET USED BY:
// - REACT TOOLSET
// - NEXT CLIENT TOOLSET

import type { RMachine } from "r-machine";
import type {
  AnyPlugHead,
  AnyResAtlas,
  ExperimentalFlags,
  HandleList,
  HandleMap,
  NamespaceCollection,
  NamespaceList,
  PluginCtxAugmenter,
  RequestScope,
  ResEquipment,
  Wire,
} from "r-machine/core";
import { createPlug, getNamespaceList, getNamespaceMap, getPlugId, getPlugOutline } from "r-machine/core";
import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "r-machine/errors";
import type { AnyLocale } from "r-machine/locale";
import type { ReactNode } from "react";
import { createContext, use, useContext, useEffect, useMemo, useReducer, useRef, useSyncExternalStore } from "react";
import { ERR_CONTEXT_NOT_FOUND, ERR_MISSING_WRITE_LOCALE } from "../errors/error-codes.js";
import type { ReactPlugDefiner, ReactPlugKitMap } from "./react-plug.js";
import { RequestScopeContext } from "./scope-context.js";
import { useVertexFrame, VertexFrame } from "./vertex-frame.js";

type WriteLocale<L extends AnyLocale> = (newLocale: L) => void | Promise<void>;

export type ReactBareToolset<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  EF extends ExperimentalFlags,
  KM extends ReactPlugKitMap<RA>,
> = {
  readonly ReactRMachine: ReactBareRMachine<L>;
  readonly Plug: ReactPlugDefiner<RA, L, KM>;
} & (EF["outerGear"] extends "on"
  ? {
      readonly VertexFrame: typeof VertexFrame;
    }
  : {});

export interface ReactBareRMachine<L extends AnyLocale> {
  (props: ReactBareRMachineProps<L>): ReactNode;
  probe: (localeOption: string | undefined) => L | undefined;
}
interface ReactBareRMachineProps<L extends AnyLocale> {
  readonly locale: L;
  readonly writeLocale?: WriteLocale<L> | undefined;
  readonly children: ReactNode;
}

interface ReactBareToolsetContext<L extends AnyLocale> {
  readonly locale: L;
  readonly writeLocale: WriteLocale<L> | undefined;
}

export async function createReactBareToolset<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends ResEquipment<RA>,
  EF extends ExperimentalFlags,
  KM extends ReactPlugKitMap<RA>,
>(rMachine: RMachine<RA, L, E, EF>, kit: KM): Promise<ReactBareToolset<RA, L, EF, KM>> {
  const validateLocale = rMachine.localeHelper.validateLocale;

  const Context = createContext<ReactBareToolsetContext<L> | null>(null);
  Context.displayName = "ReactBareToolsetContext";

  function ReactRMachine({ locale, writeLocale, children }: ReactBareRMachineProps<L>) {
    const value = useMemo<ReactBareToolsetContext<L>>(() => {
      const error = validateLocale(locale);
      if (error) {
        throw new RMachineUsageError(
          ERR_UNKNOWN_LOCALE,
          `Unable to render <ReactRMachine> - invalid locale provided "${locale}".`,
          error
        );
      }

      return { locale, writeLocale };
    }, [locale, writeLocale]);

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  ReactRMachine.probe = (locale: string | undefined) => {
    if (locale !== undefined && rMachine.localeHelper.validateLocale(locale) !== null) {
      locale = undefined;
    }

    return locale as L | undefined;
  };

  const Plug = ((...args: unknown[]) => {
    const outline = getPlugOutline<AnyResAtlas>(...args);

    const isList = outline.mode === "list";
    const nsDeps = isList
      ? getNamespaceList(outline.deps as HandleList<AnyResAtlas>)
      : getNamespaceMap(outline.deps as HandleMap<AnyResAtlas>);

    const head = {
      realm: "gate",
      mode: outline.mode,
      deps: outline.deps,
      nsDeps,
      nsDepList: isList ? [...(nsDeps as NamespaceList<AnyResAtlas>)] : Object.values(nsDeps),
    };

    const body = createPlug(head as unknown as AnyPlugHead);

    // Pre-compute the subset of top-level deps that resolve to a vertex
    // layout (`gear:outer(vertex)`). Used below to decide whether a
    // consumer can share a wire with siblings or needs its own wire. The
    // resolution is sync (layout-config lookup, no blueprint load), so
    // doing it once at plug-construction time is cheap.
    const vertexDepsSet = new Set<string>(head.nsDepList.filter((ns) => rMachine.isVertexNamespace(ns)));
    const hasAnyVertexDep = vertexDepsSet.size > 0;

    // Mutable ref shared across all consumers of this plug, holding the
    // *current* writeLocale callback. Each consumer's render updates it.
    // Bound separately from `locale` because writeLocale is a stable
    // callback that legitimately needs to be the latest one (it carries
    // the InternalReactRMachine's setState dispatcher), while `locale` is
    // bound to each wire's identity (see below).
    const sharedWriteLocaleRef: { current: WriteLocale<L> | undefined } = { current: undefined };

    // Wire cache external to React state. Critical for Suspense correctness:
    // useState's lazy initializer runs again on every render attempt that
    // suspends before commit, which would create a new wire (and a new
    // pending promise) every retry, leading to an infinite suspend loop.
    //
    // Keyed by `${locale}|${vgmSig}`. Locale MUST be part of the key under
    // React 19 concurrent rendering: during a navigation transition React
    // renders the old subtree (locale A) and the new subtree (locale B)
    // concurrently — if both shared one wire, each render would call
    // `updateRequest` to flip the wire's locale to its own, dirtying the
    // wire and forcing the other render to re-resolve, producing an
    // infinite ping-pong loop. Per-locale wires let each concurrent render
    // own its own wire; the old wire is disposed naturally when React
    // unmounts the old subtree (last `subscribe` returns → JM unsubscribe →
    // outer vertex slots disposed by genId).
    type WireEntry = { wire: Wire; localeHolder: { current: L } };
    // Module-level fallback cache for client-side (no request scope active).
    const fallbackWireCache = new Map<string, WireEntry>();
    // Per-consumer caches for plugs whose vertex deps are NOT covered by a
    // VertexFrame ancestor. Each consumer is the CREATOR of its own vertex
    // slot, so it must own its own wire (a shared wire would mean a shared
    // slot, defeating "vertex = per-instance" semantics). Keyed by the
    // consumer's stable token (useRef-held empty object) via WeakMap so the
    // cache is GC-bound to the consumer's lifetime even if explicit dispose
    // is missed.
    const perConsumerWireCaches = new WeakMap<object, Map<string, WireEntry>>();
    const plugId = getPlugId(body);
    // Resolves which cache backs `wireCache` for this consumer's render:
    //   - Server inside an active request scope: a fresh-per-request Map kept
    //     under scope.wireCachesByPlugId[plugId]. A wire stored there points
    //     at a plugin promise whose JM slot lives in scope.outerSlots; when
    //     the request ends, both the slot and this cache go away together,
    //     so wires can never outlive the plugin they reference.
    //   - Client (no scope): the module-level `fallbackWireCache`.
    const getWireCache = (requestScope: RequestScope | null): Map<string, WireEntry> => {
      if (!requestScope) {
        return fallbackWireCache;
      }
      let cache = requestScope.wireCachesByPlugId.get(plugId) as Map<string, WireEntry> | undefined;
      if (!cache) {
        cache = new Map<string, WireEntry>();
        requestScope.wireCachesByPlugId.set(plugId, cache as Map<string, unknown>);
      }
      return cache;
    };
    const getOrCreateWire = (
      locale: L,
      vertexGearMap: ReturnType<typeof useVertexFrame>,
      requestScope: RequestScope | null,
      consumerKey: object
    ): Wire => {
      const vgmSig = vertexGearMap
        ? Object.entries(vertexGearMap)
            .map(([k, v]) => `${k}=${v}`)
            .join(",")
        : "";
      const key = `${locale}|${vgmSig}`;
      // Pick the cache: per-consumer when this consumer owns any uncovered
      // vertex dep (each consumer = its own vertex instance, see [[project-
      // vertex-per-consumer-instance]]); shared otherwise.
      //
      // A vertex dep is "covered" when its namespace appears in
      // `vertexGearMap` — a `VertexFrame` ancestor has claimed it and all
      // descendants resolving the same dep should share that instance.
      // An "uncovered" vertex dep means the consumer is the creator: it
      // gets its own genId (one wire = one genId = one vertex slot) and
      // its own state cell. Without this split, sibling consumers reading
      // the same plug under no VertexFrame end up sharing one slot — the
      // "3 instances tick in sync, all show the same value" symptom.
      let wireCache: Map<string, WireEntry>;
      if (hasAnyVertexDep) {
        const hasUncoveredVertex = vertexGearMap
          ? [...vertexDepsSet].some((ns) => vertexGearMap[ns] === undefined)
          : true;
        if (hasUncoveredVertex) {
          let pcc = perConsumerWireCaches.get(consumerKey);
          if (pcc === undefined) {
            pcc = new Map<string, WireEntry>();
            perConsumerWireCaches.set(consumerKey, pcc);
          }
          wireCache = pcc;
        } else {
          wireCache = getWireCache(requestScope);
        }
      } else {
        wireCache = getWireCache(requestScope);
      }
      let entry = wireCache.get(key);
      if (!entry) {
        // localeHolder is now constant (locale is part of the cache key, so
        // each entry has a fixed locale for its lifetime). Kept as a holder
        // shape so augmentCtx's closure signature stays uniform with prior
        // code; $.setLocale still routes through the latest writeLocale via
        // sharedWriteLocaleRef.
        const localeHolder = { current: locale };
        const augmentCtx: PluginCtxAugmenter = ($: any) => {
          $.locale = localeHolder.current;
          $.setLocale = async (newLocale: L) => {
            if (newLocale === localeHolder.current) {
              return;
            }
            const error = validateLocale(newLocale);
            if (error) {
              throw error;
            }
            const writeLocale = sharedWriteLocaleRef.current;
            if (writeLocale === undefined) {
              throw new RMachineUsageError(
                ERR_MISSING_WRITE_LOCALE,
                "No writeLocale function provided to <ReactRMachine>."
              );
            }
            const result = writeLocale(newLocale);
            if (result instanceof Promise) {
              await result;
            }
          };
        };
        const wire = rMachine.getWire(kit, nsDeps as NamespaceCollection<RA>, locale, augmentCtx, vertexGearMap);
        entry = { wire, localeHolder };
        wireCache.set(key, entry);
      }
      return entry.wire;
    };

    // Fallback context used when the real context is momentarily null (e.g.
    // during a React 19 / Next App Router concurrent transition where a
    // child renders in "preview" mode before its provider is committed).
    // Using it lets us call every hook unconditionally — throwing mid-chain
    // would change the hook count between renders and trip
    // "Rendered fewer hooks than expected".
    const fallbackCtx: ReactBareToolsetContext<L> = {
      locale: rMachine.localeHelper.defaultLocale,
      writeLocale: undefined,
    };

    function useBareReactPlug() {
      const ctx = useContext(Context);
      const vertexGearMap = useVertexFrame();
      // RequestScope (per-request OuterGear tier) is propagated from an
      // adapter boundary component (e.g. NextClientRMachine) via this
      // context. When present, the wire's plugin resolution must run with
      // this scope installed as the scope-provider's override so JM's
      // `slotsForLayout` captures the request-scoped outerSlots map.
      // When null (client browser, plain React, tests), JM falls back to
      // its process-tier slots map — the correct behavior outside a
      // request lifecycle.
      const requestScope = useContext(RequestScopeContext);

      const safeCtx = ctx ?? fallbackCtx;
      sharedWriteLocaleRef.current = safeCtx.writeLocale;

      // Stable per-consumer identity. Used both for the wire cache (when
      // the plug has uncovered vertex deps, each consumer gets its own
      // wire = its own genId = its own vertex slot — see [[project-vertex-
      // per-consumer-instance]]) AND for the wire's internal per-consumer
      // cassette/unsubs/epoch state (so siblings sharing a wire don't tear
      // down each other's subscriptions on commit). The same opaque token
      // serves both purposes; the wire treats it as identity, never reads
      // it.
      const consumerKeyRef = useRef<object | null>(null);
      if (consumerKeyRef.current === null) {
        consumerKeyRef.current = {};
      }

      const wire = getOrCreateWire(safeCtx.locale, vertexGearMap, requestScope, consumerKeyRef.current);

      // Local re-render channel for cassette-tracked dep changes. Kept
      // SEPARATE from useSyncExternalStore (which is the JM-driven re-resolve
      // channel and busts the plugin Promise identity) so cassette mutations
      // do not force a Suspense throw + retry of the consumer's subtree on
      // every state change.
      //
      // The reducer increments a counter rather than toggling a boolean.
      // This is defense-in-depth against useReducer bailout: when multiple
      // notify callbacks fire within the same batch (e.g. an HMR cycle
      // leaves a stale wire whose cassette subs survive alongside the
      // current wire's, so a cell publish fans out to N notifies), N
      // dispatches with `!c` toggling return to the start and React skips
      // the commit. With a counter, N dispatches always change the state
      // by N, so a commit is guaranteed regardless of fan-out.
      const [, forceRerender] = useReducer((c: number) => c + 1, 0);
      const forceRerenderRef = useRef<() => void>(forceRerender);
      forceRerenderRef.current = forceRerender;

      // Open the wire's tracking cassette synchronously on every render. The
      // cassette's `insert()` is idempotent under the recorder model: a
      // re-render, a React Strict Mode double-invoke, or a Suspense retry
      // simply clears the prior deps. The notify callback is read indirectly
      // through a ref so the wire's stored cassette subscriptions always
      // point at the latest setState dispatch (which is stable per mount
      // but safer behind a ref). `consumerKeyRef` (declared above) is the
      // per-consumer identity passed to the wire; see its comment for why
      // it exists.
      const commit = wire.startTracking(() => {
        forceRerenderRef.current();
      }, consumerKeyRef.current);

      // Stash the latest commit fn so the post-commit effect (below) fires
      // exactly the closure of the render that actually committed. Earlier
      // closures (from abandoned / suspended renders) get overwritten and
      // never fire — they would be no-ops anyway thanks to the wire's epoch
      // check, but skipping them avoids stale work.
      const commitRef = useRef<(() => void) | null>(null);
      commitRef.current = commit;

      // Wrap getSnapshot/getServerSnapshot so the active request scope is
      // installed as the JM provider's sync override around the wire's
      // plugin resolution call. Critical for server-side: when this hook
      // runs inside a client-component SSR pass, async-context primitives
      // (AsyncLocalStorage, React.cache) don't propagate from the parent
      // server component, so the React Context is our only reliable
      // channel. The sync window from setOverride to wire.getPluginPromise
      // (which itself runs the JM resolution sync until first await,
      // capturing slotsMap into the promise closure) is uninterruptable —
      // JS is single-threaded, so concurrent requests on the same Node
      // process can't interleave here. Reset to null afterwards so we
      // don't leak the override into other components' resolutions.
      const wireSnapshot = (): Promise<unknown> => {
        if (requestScope) {
          rMachine.requestScope.getProvider().setOverride?.(requestScope);
          try {
            return wire.getPluginPromise();
          } finally {
            rMachine.requestScope.getProvider().setOverride?.(null);
          }
        }
        return wire.getPluginPromise();
      };
      const pluginPromise = useSyncExternalStore(wire.subscribe, wireSnapshot, wireSnapshot);
      const result = use(pluginPromise);

      // useEffect with no deps runs after every successful commit. The commit
      // fn itself is idempotent (its own `committed` flag + epoch check), so
      // React Strict Mode's setup/cleanup/setup cycle is safe — the second
      // setup re-fires the same commit closure, which is then a no-op.
      useEffect(() => {
        commitRef.current?.();
      });

      // Per-consumer cleanup. Fires when the wire identity changes (e.g.
      // locale switch) and on unmount. We dispose this consumer's entry on
      // the OLD wire so its cassette + cell subs don't leak. Wire-level
      // teardown (last subscriber leaves) disposes ALL remaining consumers
      // wholesale, so this is only the per-consumer path.
      //
      // The dispose is deferred to a microtask + guarded by a `mounted`
      // ref. React Strict Mode runs setup → cleanup → setup synchronously
      // in the same tick: if the dispose ran inline during the cleanup it
      // would wipe the cassette + cell subs, the immediate re-setup would
      // bring us back without subs (the render isn't re-run during the
      // dance), and subsequent action ticks would notify nothing. By
      // deferring, the re-setup flips `mounted` back to true before the
      // microtask reads it, so the dispose is skipped. On a real unmount
      // (no re-setup follows), the microtask sees `mounted === false` and
      // disposes as intended.
      const mountedRef = useRef(true);
      useEffect(() => {
        mountedRef.current = true;
        const key = consumerKeyRef.current;
        return () => {
          mountedRef.current = false;
          queueMicrotask(() => {
            if (mountedRef.current) {
              return;
            }
            if (key !== null) {
              wire.disposeConsumer(key);
            }
          });
        };
      }, [wire]);

      // Throw only AFTER every hook has been called. The throw aborts the
      // render but the hook count is now stable across renders, which keeps
      // React 19 + Turbopack happy.
      if (ctx === null) {
        throw new RMachineUsageError(ERR_CONTEXT_NOT_FOUND, "ReactBareToolsetContext not found.");
      }

      return result as never;
    }

    (body as unknown as { useR: typeof useBareReactPlug }).useR = useBareReactPlug;
    return body;
  }) as ReactPlugDefiner<RA, L, KM>;

  return {
    ReactRMachine,
    Plug,
    VertexFrame,
  } as ReactBareToolset<RA, L, EF, KM>;
}
