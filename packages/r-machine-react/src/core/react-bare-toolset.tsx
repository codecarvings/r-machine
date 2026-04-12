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
import type { AnyResAtlas, GatePlugComposer, ResKit } from "r-machine/core";
import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "r-machine/errors";
import type { AnyLocale } from "r-machine/locale";
import type { ReactNode } from "react";
import { createContext, useMemo } from "react";

// TODO: WP
// type SetLocale<L extends AnyLocale> = (newLocale: L) => Promise<void>;
type WriteLocale<L extends AnyLocale> = (newLocale: L) => void | Promise<void>;

export interface ReactBareToolset<RA extends AnyResAtlas, L extends AnyLocale, KA extends ResKit<RA>> {
  readonly ReactRMachine: ReactBareRMachine<L>;
  readonly Plug: GatePlugComposer<RA, L, KA["gate"]>;
}

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

export async function createReactBareToolset<RA extends AnyResAtlas, L extends AnyLocale, KA extends ResKit<RA>>(
  rMachine: RMachine<RA, L, KA>
): Promise<ReactBareToolset<RA, L, KA>> {
  const validateLocale = rMachine.localeHelper.validateLocale;

  const Context = createContext<ReactBareToolsetContext<L> | null>(null);
  Context.displayName = "ReactBareToolsetContext";

  /*
  function useReactToolsetContext(): ReactBareToolsetContext<L> {
    const context = useContext(Context);
    if (context === null) {
      throw new RMachineUsageError(ERR_CONTEXT_NOT_FOUND, "ReactBareToolsetContext not found.");
    }

    return context;
  }
  */

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

  // TODO: WP
  const Plug: any = undefined!;

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
  };
}
