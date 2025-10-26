"use client";

import type { AnyAtlas, AtlasNamespace, AtlasNamespaceList, RKit, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import type { Bin, BinProviderMap } from "r-machine/strategy";
import type { JSX, ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

type UseLocale = () => [string, (locale: string) => void];

type WriteLocaleBin<C> = Bin<C, {}, {}>;
type WriteLocale<C> = (newLocale: string, bin: WriteLocaleBin<C>) => void;
type ReactImpl<C> = {
  readonly writeLocale: WriteLocale<C>;
};
type ReactBinProviderMap<C> = BinProviderMap<ReactImpl<C>>;

export interface ReactToolset<A extends AnyAtlas, C> {
  readonly ReactRMachine: ReactRMachine<C>;
  readonly useLocale: UseLocale;
  readonly useR: <N extends AtlasNamespace<A>>(namespace: N) => A[N];
  readonly useRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => RKit<A, NL>;
}

interface ReactRMachineProps<C> {
  readonly locale: string;
  readonly writeLocale?: WriteLocale<C>;
  readonly children: ReactNode;
}

export interface ReactRMachine<C> {
  (props: ReactRMachineProps<C>): JSX.Element;
  probe: (localeOption: string | undefined) => string | undefined;
}

interface ReactToolsetContext<C> {
  readonly locale: string;
  readonly writeLocale: WriteLocale<C> | undefined;
}

export function createReactToolset<A extends AnyAtlas, C>(
  rMachine: RMachine<A>,
  strategyConfig: C,
  binProviders: ReactBinProviderMap<C>
): ReactToolset<A, C> {
  const validateLocale = rMachine.localeHelper.validateLocale;

  const Context = createContext<ReactToolsetContext<C> | null>(null);
  Context.displayName = "ReactToolsContext";

  function useReactToolsetContext(): ReactToolsetContext<C> {
    const context = useContext(Context);
    if (context === null) {
      throw new RMachineError("ReactToolsetContext not found.");
    }

    return context;
  }

  function ReactRMachine({ locale, writeLocale, children }: ReactRMachineProps<C>) {
    const value = useMemo<ReactToolsetContext<C>>(() => {
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
    const { locale, writeLocale } = useReactToolsetContext();
    const bin = binProviders.writeLocale({ strategyConfig, rMachine });

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

      writeLocale(newLocale, bin);
    };

    return [locale, setLocale];
  }

  function useR<N extends AtlasNamespace<A>>(namespace: N): A[N] {
    const { locale } = useReactToolsetContext();
    const r = rMachine.pickR(locale, namespace);

    if (r instanceof Promise) {
      throw r;
    }

    return r;
  }

  function useRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): RKit<A, NL> {
    const { locale } = useReactToolsetContext();
    const rKit = rMachine.pickRKit(locale, ...namespaces);

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
