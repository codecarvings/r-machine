"use client";

import {
  type AnyAtlas,
  type AtlasNamespace,
  type AtlasNamespaceList,
  type LocaleContextBridge,
  type RKit,
  RMachineError,
  type RMachineResolver,
  type RMachineToken,
} from "r-machine";
import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

export interface ReactRMachineContextValue {
  readonly localeOption: string | undefined;
  readonly token: RMachineToken;
  readonly locale: string;
}

interface ReactRMachineProviderProps {
  readonly localeOption?: string | undefined;
  readonly token?: RMachineToken;
  readonly children: ReactNode;
}

export type ReactRMachineProvider = (props: ReactRMachineProviderProps) => JSX.Element;

type UseLocaleFn = () => [string, (locale: string) => void];

interface ReactRMachineContext<A extends AnyAtlas> {
  readonly ReactRMachineProvider: ReactRMachineProvider;
  readonly useLocale: UseLocaleFn;
  readonly useR: <N extends AtlasNamespace<A>>(namespace: N) => A[N];
  readonly useRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => RKit<A, NL>;
}

const ReactRMachineContext = createContext<ReactRMachineContextValue | null>(null);
ReactRMachineContext.displayName = "ReactRMachineContext";

function useReactRMachineContext(): ReactRMachineContextValue {
  const context = useContext(ReactRMachineContext) as ReactRMachineContextValue | null;
  if (!context) {
    throw new RMachineError("useReactRMachineContext must be invoked from within a ReactRMachineProvider");
  }

  return context;
}

export function createReactRMachineContext<A extends AnyAtlas>(
  rMachineResolver: RMachineResolver<A>,
  localeContextBridge: LocaleContextBridge
): ReactRMachineContext<A> {
  const { getLocale, setLocale } = localeContextBridge;

  function ReactRMachineProvider({ localeOption, token, children }: ReactRMachineProviderProps) {
    const value = useMemo<ReactRMachineContextValue>(() => {
      const rMachine = rMachineResolver(token);
      const locale = getLocale({ localeOption, token, rMachine });
      const error = rMachine.localeHelper.validateLocale(locale);
      if (error) {
        throw error;
      }

      return { localeOption, token, locale };
    }, [localeOption, token, rMachineResolver]);

    return <ReactRMachineContext.Provider value={value}>{children}</ReactRMachineContext.Provider>;
  }

  function resolveRMachine(token: RMachineToken) {
    const rMachine = rMachineResolver(token);
    if (rMachine) {
      return rMachine;
    }
    throw new RMachineError("RMachine not found for the given token");
  }

  function useLocale(): ReturnType<UseLocaleFn> {
    const { localeOption, token, locale } = useReactRMachineContext();

    return useMemo<ReturnType<UseLocaleFn>>(
      () => [
        locale,
        (newLocale: string) => {
          const rMachine = resolveRMachine(token);
          const error = rMachine.localeHelper.validateLocale(newLocale);
          if (error) {
            throw error;
          }

          setLocale(newLocale, { localeOption, token, rMachine, currentLocale: locale });
        },
      ],
      [localeOption, token, locale]
    );
  }

  function useR<N extends AtlasNamespace<A>>(namespace: N): A[N] {
    const { token, locale } = useReactRMachineContext();
    const rMachine = resolveRMachine(token);
    const r = rMachine.pickR(locale, namespace);

    if (r instanceof Promise) {
      throw r;
    }

    return r;
  }

  function useRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): RKit<A, NL> {
    const { token, locale } = useReactRMachineContext();
    const rMachine = resolveRMachine(token);
    const rKit = rMachine.pickRKit(locale, ...namespaces);

    if (rKit instanceof Promise) {
      throw rKit;
    }

    return rKit as RKit<A, NL>;
  }

  return {
    ReactRMachineProvider,
    useLocale,
    useR,
    useRKit,
  };
}
