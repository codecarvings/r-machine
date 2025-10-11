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
import type { ReactRMachineLocaleContextBridge } from "./react-r-machine-locale-context-bridge.js";

interface ReactRMachineContextValue {
  readonly localeOption: string | undefined;
  readonly locale: string;
  readonly token: string | undefined;
}

interface ReactRMachineProviderProbeProps {
  readonly localeOption?: string | undefined;
}

interface ReactRMachineProviderProps extends ReactRMachineProviderProbeProps {
  readonly token?: string | undefined;
  readonly children: ReactNode;
}

interface ReactRMachineProviderProbeResult<A extends AnyAtlas> {
  readonly locale: string | undefined;
  readonly rMachine: RMachine<A>;
}

export interface ReactRMachineProvider<A extends AnyAtlas> {
  (props: ReactRMachineProviderProps): JSX.Element;
  probe: (props: ReactRMachineProviderProbeProps) => ReactRMachineProviderProbeResult<A>;
}

type UseLocale = () => [string, (locale: string) => void];

interface ReactRMachineContext<A extends AnyAtlas> {
  readonly ReactRMachineProvider: ReactRMachineProvider<A>;
  readonly useLocale: UseLocale;
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
  rMachine: RMachine<A>,
  localeBridge: ReactRMachineLocaleContextBridge
): ReactRMachineContext<A> {
  const { getLocale, setLocale } = localeBridge;

  function probe(localeOption: string | undefined): ReactRMachineProviderProbeResult<A> {
    let locale = getLocale({ localeOption, rMachine });
    if (locale !== undefined && rMachine.localeHelper.validateLocale(locale) !== null) {
      locale = undefined;
    }

    return {
      locale,
      rMachine,
    };
  }

  function ReactRMachineProvider({ localeOption, token, children }: ReactRMachineProviderProps) {
    const value = useMemo<ReactRMachineContextValue>(() => {
      const { locale } = probe(localeOption);
      if (locale === undefined) {
        throw new RMachineError(
          "Unable to render ReactRMachineProvider - localeBridge.getLocale function cannot determine a valid locale"
        );
      }

      return { localeOption, token, locale };
    }, [localeOption, token]);

    return <ReactRMachineContext.Provider value={value}>{children}</ReactRMachineContext.Provider>;
  }

  ReactRMachineProvider.probe = (props?: ReactRMachineProviderProbeProps) => {
    const { localeOption } = props || {};
    return probe(localeOption);
  };

  function useLocale(): ReturnType<UseLocale> {
    const { localeOption, locale } = useReactRMachineContext();

    return useMemo<ReturnType<UseLocale>>(
      () => [
        locale,
        (newLocale: string) => {
          const error = rMachine.localeHelper.validateLocale(newLocale);
          if (error) {
            throw error;
          }

          setLocale(newLocale, { localeOption, rMachine, currentLocale: locale });
        },
      ],
      [localeOption, locale, rMachine]
    );
  }

  function useR<N extends AtlasNamespace<A>>(namespace: N): A[N] {
    const { locale, token } = useReactRMachineContext();
    const r = rMachine.pickR(namespace, locale, token);

    if (r instanceof Promise) {
      throw r;
    }

    return r;
  }

  function useRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): RKit<A, NL> {
    const { locale, token } = useReactRMachineContext();
    const rKit = rMachine.pickRKit(namespaces, locale, token);

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
