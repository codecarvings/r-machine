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
import { createContext, use, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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

  function useReactToolsetContext(): ReactBareToolsetContext<L> {
    const context = useContext(Context);
    if (context === null) {
      throw new RMachineUsageError(ERR_CONTEXT_NOT_FOUND, "ReactBareToolsetContext not found.");
    }

    return context;
  }

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

    const usePlug = () => {
      const ctx = useReactToolsetContext();
      const vertexGearMap = useVertexFrame();
      const locale = ctx.locale;

      // Mutable ref kept fresh on every render. augmentCtx closes over this
      // ref instead of locale/writeLocale so it can stay identity-stable for
      // the entire lifetime of the wire while still seeing fresh values on
      // every reresolve.
      const ctxRef = useRef(ctx);
      ctxRef.current = ctx;

      const [augmentCtx] = useState<PluginCtxAugmenter>(() => ($: any) => {
        const { locale: currentLocale, writeLocale } = ctxRef.current;
        $.locale = currentLocale;
        $.setLocale = async (newLocale: L) => {
          if (newLocale === currentLocale) {
            return;
          }
          const error = validateLocale(newLocale);
          if (error) {
            throw error;
          }
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
      });

      const [wire] = useState<GateWire>(() => rMachine.getGateWire(kit, nsDeps, locale, augmentCtx, vertexGearMap));

      useEffect(() => {
        wire.updateRequest(locale, vertexGearMap);
      });

      const pluginPromise = useSyncExternalStore(wire.subscribe, wire.getPluginPromise, wire.getPluginPromise);

      return use(pluginPromise) as never;
    };

    (body as unknown as { use: typeof usePlug }).use = usePlug;
    return body;
  }) as ReactPlugDefiner<RA, L, KM>;

  return {
    ReactRMachine,
    Plug,
    VertexFrame,
  } as ReactBareToolset<RA, L, EF, KM>;
}
