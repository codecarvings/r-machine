import {
  type AnyAtlas,
  type AnyLocale,
  type AtlasNamespace,
  type AtlasNamespaceList,
  type Config,
  type RKit,
  type RMachine,
  RMachineError,
} from "r-machine";
import { createContext, type ReactNode, useContext } from "react";

interface RMachineProviderProps<A extends AnyAtlas, L extends AnyLocale> {
  rMachine: RMachine<A, L>;
  locale: L;
  children: ReactNode;
  displayName?: string;
}

interface RMachineContextValue<A extends AnyAtlas, L extends AnyLocale> {
  rMachine: RMachine<A, L>;
  locale: L;
}

interface RMachineContext<A extends AnyAtlas, L extends AnyLocale> {
  RMachineProvider: (props: RMachineProviderProps<A, L>) => JSX.Element;
  useR: <N extends AtlasNamespace<A>>(namespace: N) => A[N];
  useRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => RKit<A, NL>;
}

export function createRMachineContext<A extends AnyAtlas, L extends AnyLocale>(
  configType: Config<A, L>
): RMachineContext<A, L> {
  void configType; // Suppress unused parameter warning without prefixing with an underscore
  const RMachineContext = createContext<RMachineContextValue<A, L> | null>(null);

  function RMachineProvider({ rMachine, locale, children, displayName }: RMachineProviderProps<A, L>) {
    const value: RMachineContextValue<A, L> = {
      rMachine,
      locale,
    };
    if (displayName) {
      RMachineContext.displayName = displayName;
    }

    return <RMachineContext.Provider value={value}>{children}</RMachineContext.Provider>;
  }

  function useRMachineContext(): RMachineContextValue<A, L> {
    const context = useContext(RMachineContext);
    if (!context) {
      throw new RMachineError("useRMachineContext must be used from within a RMachineProvider");
    }
    return context;
  }

  function useR<N extends AtlasNamespace<A>>(namespace: N): A[N] {
    const { rMachine, locale } = useRMachineContext();
    const r = rMachine.pickR(locale, namespace);

    if (r instanceof Promise) {
      throw r;
    }

    return r;
  }

  function useRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): RKit<A, NL> {
    const { rMachine, locale } = useRMachineContext();
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
