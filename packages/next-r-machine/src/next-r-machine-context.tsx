import {
  type AnyAtlas,
  type AtlasNamespace,
  type AtlasNamespaceList,
  type RKit,
  type RMachine,
  type RMachineResolver,
  type RMachineToken,
  resolveRMachine,
} from "r-machine";
import type { ReactNode } from "react";
import type { ReactRMachineProvider } from "react-r-machine";

interface NextRMachineProviderProbeProps {
  readonly localeOption?: string | undefined;
  readonly token?: RMachineToken;
}

interface NextRMachineProviderProps extends NextRMachineProviderProbeProps {
  readonly children: ReactNode;
}

interface NextRMachineProviderProbeResult<A extends AnyAtlas> {
  readonly rMachine: RMachine<A>;
  readonly locale: string | undefined;
  readonly isValidLocale: boolean;
}

export interface NextRMachineProvider<A extends AnyAtlas> {
  (props: NextRMachineProviderProps): JSX.Element;
  probe: (props: NextRMachineProviderProbeProps) => NextRMachineProviderProbeResult<A>;
}

interface NextRMachineContext<A extends AnyAtlas> {
  readonly NextRMachineProvider: NextRMachineProvider<A>;
  readonly getLocale: () => string;
  readonly setLocale: (locale: string) => void;
  readonly getRMachine: () => RMachine<A>;
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

  NextRMachineProvider.probe = (props?: NextRMachineProviderProbeProps) => {
    const { token, localeOption } = props || {};
    const rMachine = resolveRMachine(rMachineResolver, token);
    // TODO: Implement locale resolution
    const locale = localeOption || "";
    const isValidLocale = rMachine.localeHelper.validateLocale(locale) === null;
    return {
      rMachine,
      locale,
      isValidLocale,
    };
  };

  function getLocale() {
    // TODO: Implement this
    return "en";
  }

  function setLocale(locale: string) {
    // TODO: Implement this
    void locale;
    throw new Error("Not implemented");
  }

  function getRMachine() {
    // TODO: Implement this
    return rMachineResolver as any;
  }

  function pickR<N extends AtlasNamespace<A>>(namespace: N): A[N] {
    // TODO: Implement this
    void namespace;
    return undefined!;
  }

  function pickRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): RKit<A, NL> {
    // TODO: Implement this
    void namespaces;
    return undefined!;
  }

  return {
    NextRMachineProvider,
    getLocale,
    setLocale,
    getRMachine,
    pickR,
    pickRKit,
  };
}
