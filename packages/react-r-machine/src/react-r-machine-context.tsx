import {
  type AnyAtlas,
  type AtlasNamespace,
  type AtlasNamespaceList,
  type RKit,
  RMachine,
  type RMachineConfigFactory,
  RMachineError,
} from "r-machine";
import { createContext, type ReactNode, useContext, useMemo } from "react";

/*
export interface FullLocaleProvider {
  getLocale: () => string;
  setLocale: (locale: string) => void;
}
*/

interface RMachineProviderProps {
  configFactory: RMachineConfigFactory;
  locale: string;
  displayName?: string;
  children: ReactNode;
}

type UseLocaleFn = () => [string, (locale: string) => void];

interface ReactRMachineContextValue<A extends AnyAtlas = AnyAtlas> {
  rMachine: RMachine<A>;
  locale: string;
  useLocale: UseLocaleFn;
}

interface ReactRMachineHooks<A extends AnyAtlas> {
  useR: <N extends AtlasNamespace<A>>(namespace: N) => A[N];
  useRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => RKit<A, NL>;
}

const ReactRMachineContext = createContext<ReactRMachineContextValue | null>(null);

export function RMachineProvider({ configFactory, locale, displayName, children }: RMachineProviderProps) {
  const value = useMemo(() => {
    const rMachine = RMachine.get(configFactory);
    const useLocale: UseLocaleFn = () => {
      return [
        locale,
        (_newLocale: string) => {
          throw new RMachineError("setLocale not implemented");
        },
      ];
    };
    const memoValue: ReactRMachineContextValue = {
      rMachine,
      locale,
      useLocale,
    };
    if (displayName) {
      ReactRMachineContext.displayName = displayName;
    }
    return memoValue;
  }, [configFactory, locale, displayName]);

  return <ReactRMachineContext.Provider value={value}>{children}</ReactRMachineContext.Provider>;
}

function useReactRMachineContext<A extends AnyAtlas>(): ReactRMachineContextValue<A> {
  const context = useContext(ReactRMachineContext) as ReactRMachineContextValue<A> | null;
  if (!context) {
    throw new RMachineError("useReactRMachineContext must be invoked from within a RMachineProvider");
  }

  return context;
}

export function useLocale(): ReturnType<UseLocaleFn> {
  const { useLocale } = useReactRMachineContext();
  return useLocale();
}

export function createReactRMachineHooks<A extends AnyAtlas>(): ReactRMachineHooks<A> {
  function useR<N extends AtlasNamespace<A>>(namespace: N): A[N] {
    const { rMachine, locale } = useReactRMachineContext<A>();
    const r = rMachine.pickR(locale, namespace);

    if (r instanceof Promise) {
      throw r;
    }

    return r;
  }

  function useRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): RKit<A, NL> {
    const { rMachine, locale } = useReactRMachineContext<A>();
    const rKit = rMachine.pickRKit(locale, ...namespaces);

    if (rKit instanceof Promise) {
      throw rKit;
    }

    return rKit as RKit<A, NL>;
  }
  1;

  return {
    useR,
    useRKit,
  };
}
