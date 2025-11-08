"use client";

import type { AnyAtlas, AtlasNamespace, AtlasNamespaceList, RKit, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import type { JSX, ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo } from "react";

type SetLocale = (newLocale: string) => void;
type WriteLocale = (newLocale: string) => void;

export interface ReactToolset<A extends AnyAtlas> {
  readonly ReactRMachine: ReactRMachine;
  readonly useLocale: () => string;
  // Performance optimization: do not use the same approach as useState ([state, setState]) because with Bins
  // the setter function should be recreated on every render to capture the latest context.
  readonly useSetLocale: () => SetLocale;
  readonly useR: <N extends AtlasNamespace<A>>(namespace: N) => A[N];
  readonly useRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => RKit<A, NL>;
}

interface ReactRMachineProps {
  readonly locale: string;
  readonly writeLocale?: WriteLocale;
  readonly children: ReactNode;
}

export interface ReactRMachine {
  (props: ReactRMachineProps): JSX.Element;
  probe: (localeOption: string | undefined) => string | undefined;
}

interface ReactToolsetContext {
  readonly locale: string;
  readonly writeLocale: WriteLocale | undefined;
}

export function createReactToolset<A extends AnyAtlas>(rMachine: RMachine<A>): ReactToolset<A> {
  const validateLocale = rMachine.localeHelper.validateLocale;

  const Context = createContext<ReactToolsetContext | null>(null);
  Context.displayName = "ReactToolsetContext";

  function useReactToolsetContext(): ReactToolsetContext {
    const context = useContext(Context);
    if (context === null) {
      throw new RMachineError("ReactToolsetContext not found.");
    }

    return context;
  }

  function ReactRMachine({ locale, writeLocale, children }: ReactRMachineProps) {
    const value = useMemo<ReactToolsetContext>(() => {
      const error = validateLocale(locale);
      if (error) {
        throw new RMachineError(`Unable to render <ReactRMachine> - invalid locale provided "${locale}".`, error);
      }

      return { locale, writeLocale };
    }, [locale, writeLocale]);

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  ReactRMachine.probe = (locale: string | undefined) => {
    if (locale !== undefined && rMachine.localeHelper.validateLocale(locale) !== null) {
      locale = undefined;
    }

    return locale;
  };

  function useLocale(): string {
    const context = useReactToolsetContext();
    return context.locale;
  }

  function setLocale(newLocale: string, context: ReactToolsetContext): void {
    const { locale, writeLocale } = context;
    if (newLocale === locale) {
      return;
    }

    const error = validateLocale(newLocale);
    if (error) {
      throw error;
    }

    if (writeLocale === undefined) {
      throw new RMachineError("No writeLocale function provided to <ReactRMachine>.");
    }

    writeLocale(newLocale);
  }

  function useSetLocale(): SetLocale {
    const context = useReactToolsetContext();
    return useCallback<SetLocale>(
      (newLocale: string) => {
        setLocale(newLocale, context);
      },
      [context]
    );
  }

  function useR<N extends AtlasNamespace<A>>(namespace: N): A[N] {
    const context = useReactToolsetContext();
    const r = rMachine.hybridPickR(context.locale, namespace);

    if (r instanceof Promise) {
      throw r;
    }

    return r;
  }

  function useRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): RKit<A, NL> {
    const context = useReactToolsetContext();
    const rKit = rMachine.hybridPickRKit(context.locale, ...namespaces);

    if (rKit instanceof Promise) {
      throw rKit;
    }

    return rKit as RKit<A, NL>;
  }

  return {
    ReactRMachine,
    useLocale,
    useSetLocale,
    useR,
    useRKit,
  };
}
