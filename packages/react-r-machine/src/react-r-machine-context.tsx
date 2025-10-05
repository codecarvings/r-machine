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

interface ReactRMachineContextValue<A extends AnyAtlas> {
  contextId: symbol;
  rMachine: RMachine<A>;
  locale: string;
  useLocale: UseLocaleFn;
}

interface ReactRMachineContext<A extends AnyAtlas> {
  RMachineProvider: (props: RMachineProviderProps) => JSX.Element;
  useLocale: UseLocaleFn;
  useR: <N extends AtlasNamespace<A>>(namespace: N) => A[N];
  useRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => RKit<A, NL>;
}

let contextIdCounter = 0;

export function createReactRMachineContext<A extends AnyAtlas>(): ReactRMachineContext<A> {
  const contextId = Symbol(`ReactRMachineContext#${++contextIdCounter}`);
  const ReactRMachineContext = createContext<ReactRMachineContextValue<A> | null>(null);

  function RMachineProvider({ configFactory, locale, displayName, children }: RMachineProviderProps) {
    const value = useMemo(() => {
      const rMachine = RMachine.get<A>(configFactory);
      const useLocale: UseLocaleFn = () => {
        return [
          locale,
          (_newLocale: string) => {
            throw new RMachineError("setLocale not implemented");
          },
        ];
      };
      const memoValue: ReactRMachineContextValue<A> = {
        contextId,
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

  function useReactRMachineContext(): ReactRMachineContextValue<A> {
    const context = useContext(ReactRMachineContext);
    if (!context) {
      throw new RMachineError("useReactRMachineContext must be invoked from within a RMachineProvider");
    }
    if (context.contextId !== contextId) {
      throw new RMachineError("useReactRMachineContext context mismatch");
    }
    return context;
  }

  function useLocale(): ReturnType<UseLocaleFn> {
    const { useLocale } = useReactRMachineContext();
    return useLocale();
  }

  function useR<N extends AtlasNamespace<A>>(namespace: N): A[N] {
    const { rMachine, locale } = useReactRMachineContext();
    const r = rMachine.pickR(locale, namespace);

    if (r instanceof Promise) {
      throw r;
    }

    return r;
  }

  function useRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): RKit<A, NL> {
    const { rMachine, locale } = useReactRMachineContext();
    const rKit = rMachine.pickRKit(locale, ...namespaces);

    if (rKit instanceof Promise) {
      throw rKit;
    }

    return rKit as RKit<A, NL>;
  }
  1;

  return {
    RMachineProvider,
    useLocale,
    useR,
    useRKit,
  };
}
