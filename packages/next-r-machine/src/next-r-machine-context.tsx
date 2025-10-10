import type { AnyAtlas, AtlasNamespace, AtlasNamespaceList, RKit, RMachineResolver, RMachineToken } from "r-machine";
import type { ReactNode } from "react";
import type { ReactRMachineProvider } from "react-r-machine";

interface NextRMachineProviderProps {
  readonly localeOption?: string | undefined;
  readonly token?: RMachineToken;
  readonly children: ReactNode;
}

export type NextRMachineProvider = (props: NextRMachineProviderProps) => JSX.Element;

interface NextRMachineContext<A extends AnyAtlas> {
  readonly NextRMachineProvider: NextRMachineProvider;
  readonly getLocale: () => string;
  readonly setLocale: (locale: string) => void;
  readonly pickR: <N extends AtlasNamespace<A>>(namespace: N) => A[N];
  readonly pickRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => RKit<A, NL>;
}

export function createNextRMachineContext<A extends AnyAtlas = AnyAtlas>(
  rMachineResolver: RMachineResolver<A>,
  ReactRMachineProvider: ReactRMachineProvider
): NextRMachineContext<A> {
  void rMachineResolver;

  function NextRMachineProvider({ localeOption, token, children }: NextRMachineProviderProps) {
    return (
      <ReactRMachineProvider localeOption={localeOption} token={token}>
        {children}
      </ReactRMachineProvider>
    );
  }

  function getLocale() {
    return undefined!;
  }

  function setLocale(locale: string) {
    void locale;
    throw new Error("Not implemented");
  }

  function pickR<N extends AtlasNamespace<A>>(namespace: N): A[N] {
    void namespace;
    return undefined!;
  }

  function pickRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): RKit<A, NL> {
    void namespaces;
    return undefined!;
  }

  return {
    NextRMachineProvider,
    getLocale,
    setLocale,
    pickR,
    pickRKit,
  };
}
