import type { AnyAtlas, AtlasNamespace, AtlasNamespaceList, RKit, RMachine, RMachineResolver } from "r-machine";
import type { ReactNode } from "react";
import type { ReactRMachineProvider } from "react-r-machine";

interface NextRMachineProviderProps {
  locale: string;
  children: ReactNode;
}

type UseLocaleFn = () => [string, (locale: string) => void];

export interface NextRMachineContextValue<A extends AnyAtlas = AnyAtlas> {
  rMachine: RMachine<A>;
  locale: string;
  useLocale: UseLocaleFn;
}

export interface NextRMachineFunctions<A extends AnyAtlas> {
  pickR: <N extends AtlasNamespace<A>>(namespace: N) => A[N];
  pickRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => RKit<A, NL>;
}

export function createNextRMachineProvider<A extends AnyAtlas = AnyAtlas>(
  rMachineResolver: RMachineResolver<A>,
  ReactRMachineProvider: ReactRMachineProvider
) {
  void rMachineResolver;
  return function NextRMachineProvider({ locale, children }: NextRMachineProviderProps) {
    return <ReactRMachineProvider locale={locale}>{children}</ReactRMachineProvider>;
  };
}
