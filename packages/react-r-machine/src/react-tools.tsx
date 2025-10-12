"use client";

import {
  type AnyAtlas,
  type AtlasNamespace,
  type AtlasNamespaceList,
  type RKit,
  type RMachine,
  RMachineError,
} from "r-machine";
import type { JSX, ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";
import { ReactStrategy } from "./react-strategy.js";

interface ReactTools<A extends AnyAtlas> {
  readonly ReactRMachine: ReactRMachine<A>;
  readonly useLocale: UseLocale;
  readonly useR: <N extends AtlasNamespace<A>>(namespace: N) => A[N];
  readonly useRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => RKit<A, NL>;
}

type UseLocale = () => [string, (locale: string) => void];

interface ReactRMachineContextValue {
  readonly locale: string;
}

interface ReactRMachineProbeProps {
  readonly localeOption?: string | undefined;
}

interface ReactRMachineProps extends ReactRMachineProbeProps {
  readonly children: ReactNode;
}

interface ReactRMachineProbeResult<A extends AnyAtlas> {
  readonly locale: string | undefined;
  readonly rMachine: RMachine<A>;
}

export interface ReactRMachine<A extends AnyAtlas> {
  (props: ReactRMachineProps): JSX.Element;
  probe: (props: ReactRMachineProbeProps) => ReactRMachineProbeResult<A>;
}

const ReactRMachineContext = createContext<ReactRMachineContextValue | null>(null);
ReactRMachineContext.displayName = "ReactRMachineContext";

function useReactRMachineContext(): ReactRMachineContextValue {
  const context = useContext(ReactRMachineContext) as ReactRMachineContextValue | null;
  if (!context) {
    throw new RMachineError("useReactRMachineContext must be invoked from within a ReactRMachine");
  }

  return context;
}

export function createReactTools<A extends AnyAtlas>(rMachine: RMachine<A>, strategy: ReactStrategy): ReactTools<A> {
  const { readLocale, writeLocale } = ReactStrategy.getReactStrategyImpl(strategy, rMachine);

  function probe(localeOption: string | undefined): ReactRMachineProbeResult<A> {
    let locale = readLocale({ localeOption });
    if (locale !== undefined && rMachine.localeHelper.validateLocale(locale) !== null) {
      locale = undefined;
    }

    return {
      locale,
      rMachine,
    };
  }

  function ReactRMachine({ localeOption, children }: ReactRMachineProps) {
    const value = useMemo<ReactRMachineContextValue>(() => {
      const { locale } = probe(localeOption);
      if (locale === undefined) {
        throw new RMachineError(
          "Unable to render ReactRMachine - ReactStrategyImpl.getLocale function cannot determine a valid locale"
        );
      }

      return { locale };
    }, [localeOption]);

    return <ReactRMachineContext.Provider value={value}>{children}</ReactRMachineContext.Provider>;
  }

  ReactRMachine.probe = (props?: ReactRMachineProbeProps) => {
    const { localeOption } = props || {};
    return probe(localeOption);
  };

  function useLocale(): ReturnType<UseLocale> {
    const { locale } = useReactRMachineContext();

    return useMemo<ReturnType<UseLocale>>(
      () => [
        locale,
        (newLocale: string) => {
          const error = rMachine.localeHelper.validateLocale(newLocale);
          if (error) {
            throw error;
          }

          writeLocale(newLocale, { currentLocale: locale });
        },
      ],
      [locale, rMachine]
    );
  }

  function useR<N extends AtlasNamespace<A>>(namespace: N): A[N] {
    const { locale } = useReactRMachineContext();
    const r = rMachine.pickR(locale, namespace);

    if (r instanceof Promise) {
      throw r;
    }

    return r;
  }

  function useRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): RKit<A, NL> {
    const { locale } = useReactRMachineContext();
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
