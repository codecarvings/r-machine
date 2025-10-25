"use client";

import type { AnyAtlas, AtlasNamespace, AtlasNamespaceList, RKit, RMachine } from "r-machine";
import { RMachineError } from "r-machine/common";
import type { ImplPackage } from "r-machine/strategy";
import type { JSX, ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";
import type { ReactImpl } from "./react-impl.js";

export interface ReactTools<A extends AnyAtlas> {
  readonly ReactRMachine: ReactRMachine;
  readonly useLocale: UseLocale;
  readonly useR: <N extends AtlasNamespace<A>>(namespace: N) => A[N];
  readonly useRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => RKit<A, NL>;
}

interface ReactRMachineProps {
  readonly locale: string;
  readonly children: ReactNode;
}

export interface ReactRMachine {
  (props: ReactRMachineProps): JSX.Element;
  probe: (localeOption: string | undefined) => string | undefined;
}

type UseLocale = () => [string, (locale: string) => void];

export function createReactTools<A extends AnyAtlas, C>(
  rMachine: RMachine<A>,
  strategyConfig: C,
  implPackage: ImplPackage<ReactImpl<C>>
): ReactTools<A> {
  const validateLocale = rMachine.localeHelper.validateLocale;

  const Context = createContext<string | null>(null);
  Context.displayName = "ReactToolsContext";

  function useCurrentLocale(): string {
    const locale = useContext(Context);
    if (locale === null) {
      throw new RMachineError("ReactToolsContext not found. ReactTools must be invoked from within a ReactRMachine.");
    }

    return locale;
  }

  function ReactRMachine({ locale, children }: ReactRMachineProps) {
    const value = useMemo<string>(() => {
      const error = validateLocale(locale);
      if (error) {
        throw new RMachineError(`Unable to render ReactRMachine - invalid locale provided "${locale}".`, error);
      }

      return locale;
    }, [locale]);

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  ReactRMachine.probe = (locale: string | undefined) => {
    if (locale !== undefined && rMachine.localeHelper.validateLocale(locale) !== null) {
      locale = undefined;
    }

    return locale;
  };

  function useLocale(): ReturnType<UseLocale> {
    const locale = useCurrentLocale();
    const bin = implPackage.binProviders.writeLocale({ strategyConfig, rMachine });

    return [
      locale,
      (newLocale: string) => {
        if (newLocale === locale) {
          return;
        }

        const error = validateLocale(newLocale);
        if (error) {
          throw error;
        }

        implPackage.impl.writeLocale(newLocale, bin);
      },
    ];
  }

  function useR<N extends AtlasNamespace<A>>(namespace: N): A[N] {
    const locale = useCurrentLocale();
    const r = rMachine.pickR(locale, namespace);

    if (r instanceof Promise) {
      throw r;
    }

    return r;
  }

  function useRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): RKit<A, NL> {
    const locale = useCurrentLocale();
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
