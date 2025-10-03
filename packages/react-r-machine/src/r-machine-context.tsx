import {
  type AnyAtlas,
  type AtlasNamespace,
  type AtlasNamespaceList,
  type RKit,
  type RMachine,
  RMachineError,
} from "r-machine";
import { createContext, type ReactNode, useContext, useMemo } from "react";

interface RMachineProviderProps {
  locale: string;
  displayName?: string;
  children: ReactNode;
}

interface RMachineContextValue {
  contextId: symbol;
  locale: string;
}

interface RMachineContext<A extends AnyAtlas> {
  RMachineProvider: (props: RMachineProviderProps) => JSX.Element;
  useR: <N extends AtlasNamespace<A>>(namespace: N) => A[N];
  useRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => RKit<A, NL>;
}

let contextIdCounter = 0;

export function createRMachineContext<A extends AnyAtlas>(rMachine: RMachine<A>): RMachineContext<A> {
  const contextId = Symbol(`RMachineContext#${++contextIdCounter}`);
  const RMachineContext = createContext<RMachineContextValue | null>(null);

  function RMachineProvider({ locale, displayName, children }: RMachineProviderProps) {
    const value = useMemo(() => {
      const memoValue: RMachineContextValue = {
        contextId,
        locale,
      };
      if (displayName) {
        RMachineContext.displayName = displayName;
      }
      return memoValue;
    }, [locale, displayName]);

    return <RMachineContext.Provider value={value}>{children}</RMachineContext.Provider>;
  }

  function useRMachineContext(): RMachineContextValue {
    const context = useContext(RMachineContext);
    if (!context) {
      throw new RMachineError("useRMachineContext must be invoked from within a RMachineProvider");
    }
    if (context.contextId !== contextId) {
      throw new RMachineError("useRMachineContext context mismatch");
    }
    return context;
  }

  function useR<N extends AtlasNamespace<A>>(namespace: N): A[N] {
    const { locale } = useRMachineContext();
    const r = rMachine.pickR(locale, namespace);

    if (r instanceof Promise) {
      throw r;
    }

    return r;
  }

  function useRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): RKit<A, NL> {
    const { locale } = useRMachineContext();
    const rKit = rMachine.pickRKit(locale, ...namespaces);

    if (rKit instanceof Promise) {
      throw rKit;
    }

    return rKit as RKit<A, NL>;
  }

  return {
    RMachineProvider,
    useR,
    useRKit,
  };
}
