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
  GateWire,
  HandleList,
  HandleMap,
  NamespaceList,
  PluginCtxAugmenter,
  ResEquipment,
} from "r-machine/core";
import { createPlug, getNamespaceList, getNamespaceMap, getPlugOutline } from "r-machine/core";
import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "r-machine/errors";
import type { AnyLocale } from "r-machine/locale";
import type { ReactNode } from "react";
import { createContext, use, useContext, useEffect, useMemo, useReducer, useRef, useSyncExternalStore } from "react";
import { ERR_CONTEXT_NOT_FOUND, ERR_MISSING_WRITE_LOCALE } from "../errors/error-codes.js";
import type { ReactPlugDefiner, ReactPlugKitMap } from "./react-plug.js";
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
    // The cache is keyed by vertexGearMap signature only — NOT by locale.
    // Locale changes route through `wire.updateRequest()`, which preserves
    // wire identity. This matters for two reasons:
    //   1. useSyncExternalStore stays subscribed across locale changes
    //      instead of unsubscribing the old wire (which would orphan its
    //      cassette subscriptions to cells, causing extra forceRerender
    //      dispatches and useReducer bailouts on surviving consumers).
    //   2. The wire's cassette state survives, so we don't leak cell
    //      subscriptions across locale switches.
    type WireEntry = { wire: GateWire; localeHolder: { current: L } };
    const wireCache = new Map<string, WireEntry>();
    const getOrCreateWire = (locale: L, vertexGearMap: ReturnType<typeof useVertexFrame>): GateWire => {
      const key = vertexGearMap
        ? Object.entries(vertexGearMap)
            .map(([k, v]) => `${k}=${v}`)
            .join(",")
        : "";
      let entry = wireCache.get(key);
      if (!entry) {
        // augmentCtx reads locale dynamically from `localeHolder.current` so
        // that wire.updateRequest's re-resolve picks up the new locale on
        // the $ context. JM calls augmentCtx fresh for every buildPlugin
        // pass, so the latest holder value always wins.
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
        const wire = rMachine.getGateWire(kit, nsDeps, locale, augmentCtx, vertexGearMap);
        entry = { wire, localeHolder };
        wireCache.set(key, entry);
      } else if (entry.localeHolder.current !== locale) {
        entry.localeHolder.current = locale;
        entry.wire.updateRequest(locale, vertexGearMap);
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

      const safeCtx = ctx ?? fallbackCtx;
      sharedWriteLocaleRef.current = safeCtx.writeLocale;
      const wire = getOrCreateWire(safeCtx.locale, vertexGearMap);

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
      // but safer behind a ref).
      const commit = wire.startTracking(() => {
        forceRerenderRef.current();
      });

      // Stash the latest commit fn so the post-commit effect (below) fires
      // exactly the closure of the render that actually committed. Earlier
      // closures (from abandoned / suspended renders) get overwritten and
      // never fire — they would be no-ops anyway thanks to the wire's epoch
      // check, but skipping them avoids stale work.
      const commitRef = useRef<(() => void) | null>(null);
      commitRef.current = commit;

      const pluginPromise = useSyncExternalStore(wire.subscribe, wire.getPluginPromise, wire.getPluginPromise);
      const result = use(pluginPromise);

      // useEffect with no deps runs after every successful commit. The commit
      // fn itself is idempotent (its own `committed` flag + epoch check), so
      // React Strict Mode's setup/cleanup/setup cycle is safe — the second
      // setup re-fires the same commit closure, which is then a no-op.
      useEffect(() => {
        commitRef.current?.();
      });

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
