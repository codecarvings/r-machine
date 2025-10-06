import type { AnyAtlas, AtlasNamespace, AtlasNamespaceList, RKit, RMachine, RMachineConfigFactory } from "r-machine";
import type { ReactNode } from "react";
import { ReactRMachineProvider } from "react-r-machine";

interface NextRMachineProviderProps {
  configFactory: RMachineConfigFactory;
  locale: string;
  displayName?: string | undefined;
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

export function NextRMachineProvider({ configFactory, locale, displayName, children }: NextRMachineProviderProps) {
  return (
    <ReactRMachineProvider configFactory={configFactory} locale={locale} displayName={displayName}>
      {children}
    </ReactRMachineProvider>
  );
}
