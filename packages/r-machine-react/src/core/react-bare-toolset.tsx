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
  AnyNamespaceMap,
  AnyPlugHead,
  AnyResAtlas,
  ExperimentalFlags,
  GateWire,
  HandleList,
  HandleMap,
  ResEquipment,
} from "r-machine/core";
import { createPlug, getNamespaceList, getNamespaceMap, getPlugOutline, isNamespaceList } from "r-machine/core";
import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "r-machine/errors";
import type { AnyLocale } from "r-machine/locale";
import type { ReactNode } from "react";
import { createContext, use, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ERR_CONTEXT_NOT_FOUND } from "../errors/error-codes.js";
import type { ReactPlugDefiner, ReactPlugKitMap } from "./react-plug.js";
import { useVertexFrame, VertexFrame } from "./vertex-frame.js";

// TODO: WP
// type SetLocale<L extends AnyLocale> = (newLocale: L) => Promise<void>;
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
>(rMachine: RMachine<RA, L, E, EF>): Promise<ReactBareToolset<RA, L, EF, KM>> {
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

  const stubSetLocale = async (_: L): Promise<void> => {
    throw new Error("setLocale is not yet implemented in the React Plug context.");
  };

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
      realm: "gate" as const,
      mode: outline.mode,
      deps: outline.deps,
      nsDeps,
      nsDepList: isNamespaceList(nsDeps) ? [...nsDeps] : Object.values(nsDeps),
    };

    const body = createPlug(head as unknown as AnyPlugHead);

    const usePlug = () => {
      const ctx = useReactToolsetContext();
      const vertexGearMap = useVertexFrame();
      const locale = ctx.locale;

      const augmentCtx = useMemo(
        () => ($: any) => {
          $.locale = locale;
          $.setLocale = stubSetLocale;
        },
        [locale]
      );

      const [wire] = useState<GateWire>(() =>
        rMachine.getGateWire({} as AnyNamespaceMap, nsDeps, locale, augmentCtx, vertexGearMap)
      );

      useEffect(() => {
        wire.updateRequest(locale, vertexGearMap);
      });

      const pluginPromise = useSyncExternalStore(wire.subscribe, wire.getPluginPromise, wire.getPluginPromise);

      return use(pluginPromise) as never;
    };

    (body as unknown as { use: typeof usePlug }).use = usePlug;
    return body;
  }) as ReactPlugDefiner<RA, L, KM>;

  /*
  function useLocale(): L {
    return useReactToolsetContext().locale;
  }

  async function setLocale(newLocale: L, context: ReactBareToolsetContext<L>) {
    const { locale, writeLocale } = context;
    if (newLocale === locale) {
      return;
    }

    const error = validateLocale(newLocale);
    if (error) {
      throw error;
    }

    if (writeLocale === undefined) {
      throw new RMachineUsageError(ERR_MISSING_WRITE_LOCALE, "No writeLocale function provided to <ReactRMachine>.");
    }

    const writeLocaleResult = writeLocale(newLocale);
    if (writeLocaleResult instanceof Promise) {
      await writeLocaleResult;
    }
  }

  function useSetLocale(): SetLocale<L> {
    const context = useReactToolsetContext();
    return useCallback<SetLocale<L>>((newLocale: L) => setLocale(newLocale, context), [context]);
  }

  const hybridPickR: (typeof rMachine)["hybridPickR"] = (rMachine as any).hybridPickR;
  function useR<N extends Namespace<RA>>(namespace: N): RA[N] {
    const context = useReactToolsetContext();
    const r = hybridPickR(context.locale, namespace);

    if (r instanceof Promise) {
      throw r;
    }
    return r;
  }

  const hybridPickRKit: (typeof rMachine)["hybridPickRKit"] = (rMachine as any).hybridPickRKit;
  function useRKit<NL extends NamespaceList<RA>>(...namespaces: NL): RList<RA, NL> {
    const context = useReactToolsetContext();
    const rList = hybridPickRKit(context.locale, ...namespaces);

    if (rList instanceof Promise) {
      throw rList;
    }
    return rList as RList<RA, NL>;
  }
  */

  return {
    ReactRMachine,
    Plug,
    VertexFrame,
  } as ReactBareToolset<RA, L, EF, KM>;
}
