"use client";

import type { AnyAtlas, AtlasNamespace, AtlasNamespaceList, RKit, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import type { JSX, ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

type UseLocale = () => [string, (locale: string) => void];
type WriteLocale = (newLocale: string) => void;

export interface ReactToolset<A extends AnyAtlas> {
  readonly ReactRMachine: ReactRMachine;
  readonly useLocale: UseLocale;
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
  Context.displayName = "ReactToolsContext";

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

  function useLocale(): ReturnType<UseLocale> {
    const context = useReactToolsetContext();
    return useMemo<ReturnType<UseLocale>>(() => {
      const { locale, writeLocale } = context;
      const setLocale = (newLocale: string) => {
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
      };

      return [locale, setLocale];
    }, [context]);
  }

  function useR<N extends AtlasNamespace<A>>(namespace: N): A[N] {
    const context = useReactToolsetContext();
    const r = rMachine.pickR(context.locale, namespace);

    if (r instanceof Promise) {
      throw r;
    }

    return r;
  }

  function useRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): RKit<A, NL> {
    const context = useReactToolsetContext();
    const rKit = rMachine.pickRKit(context.locale, ...namespaces);

    if (rKit instanceof Promise) {
      throw rKit;
    }

    return rKit as RKit<A, NL>;
  }

  return {
    ReactRMachine,
    useLocale,
    useR,
    useRKit,
  };
}
