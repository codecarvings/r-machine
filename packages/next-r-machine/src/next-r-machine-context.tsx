import {
  type AnyAtlas,
  type AtlasNamespace,
  type AtlasNamespaceList,
  type LocaleContextBridge,
  type RKit,
  type RMachine,
  RMachineError,
  type RMachineResolver,
  type RMachineToken,
  resolveRMachine,
} from "r-machine";
import type { ReactNode } from "react";
import { cache, type JSX } from "react";
import type { ReactRMachineProvider } from "react-r-machine";

interface NextRMachineContextValue<A extends AnyAtlas> {
  readonly ready: true;
  readonly localeOption: string | undefined;
  readonly token: RMachineToken;
  readonly locale: string;
  readonly rMachine: RMachine<A>;
}

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
}

export interface NextRMachineProvider<A extends AnyAtlas> {
  (props: NextRMachineProviderProps): JSX.Element;
  probe: (props: NextRMachineProviderProbeProps) => NextRMachineProviderProbeResult<A>;
}

interface NextRMachineContext<A extends AnyAtlas> {
  readonly NextRMachineProvider: NextRMachineProvider<A>;
  readonly getLocale: () => Promise<string>;
  readonly setLocale: (newLocale: string) => Promise<void>;
  readonly getRMachine: () => Promise<RMachine<A>>;
  readonly pickR: <N extends AtlasNamespace<A>>(namespace: N) => Promise<A[N]>;
  readonly pickRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => Promise<RKit<A, NL>>;
}

export function createNextRMachineContext<A extends AnyAtlas = AnyAtlas>(
  rMachineResolver: RMachineResolver<A>,
  localeContextBridge: LocaleContextBridge,
  ReactRMachineProvider: ReactRMachineProvider
): NextRMachineContext<A> {
  const { getLocale: _getLocale, setLocale: _setLocale } = localeContextBridge;

  const getRawNextRMachineContext = cache((): NextRMachineContextValue<A> => {
    return {} as any;
  });

  async function getNextRMachineContext(): Promise<NextRMachineContextValue<A>> {
    const context = getRawNextRMachineContext();
    if (!context.ready) {
      throw new RMachineError("getNextRMachineContext must be invoked from within a ReactRMachineProvider");
    }
    return context;
  }

  function probe(localeOption: string | undefined, token: RMachineToken): NextRMachineProviderProbeResult<A> {
    const rMachine = resolveRMachine(rMachineResolver, token);
    let locale = _getLocale({ localeOption, token, rMachine });
    if (locale !== undefined && rMachine.localeHelper.validateLocale(locale) !== null) {
      locale = undefined;
    }

    return {
      locale,
      rMachine,
    };
  }

  function NextRMachineProvider({ localeOption, token, children }: NextRMachineProviderProps) {
    const { locale, rMachine } = probe(localeOption, token);
    if (locale === undefined) {
      throw new RMachineError(
        "Unable to render NextRMachineProvider - LocaleContextBridge.getLocale function cannot determine the locale (undefined)"
      );
    }

    const context = getRawNextRMachineContext() as {
      -readonly [P in keyof NextRMachineContextValue<A>]: NextRMachineContextValue<A>[P];
    };
    context.ready = true;
    context.locale = locale;
    context.localeOption = localeOption;
    context.token = token;
    context.rMachine = rMachine;

    return (
      <ReactRMachineProvider localeOption={localeOption} token={token}>
        {children}
      </ReactRMachineProvider>
    );
  }

  NextRMachineProvider.probe = (props?: NextRMachineProviderProbeProps) => {
    const { localeOption, token } = props || {};
    return probe(localeOption, token);
  };

  async function getLocale(): Promise<string> {
    const { locale } = await getNextRMachineContext();
    return locale;
  }

  async function setLocale(newLocale: string) {
    const { localeOption, token, locale, rMachine } = await getNextRMachineContext();
    const error = rMachine.localeHelper.validateLocale(newLocale);
    if (error) {
      throw error;
    }

    _setLocale(newLocale, { localeOption, token, rMachine, currentLocale: locale });
  }

  async function getRMachine(): Promise<RMachine<A>> {
    const { rMachine } = await getNextRMachineContext();
    return rMachine;
  }

  async function pickR<N extends AtlasNamespace<A>>(namespace: N): Promise<A[N]> {
    const { locale, rMachine } = await getNextRMachineContext();
    return rMachine.pickR(locale, namespace);
  }

  async function pickRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): Promise<RKit<A, NL>> {
    const { locale, rMachine } = await getNextRMachineContext();
    return rMachine.pickRKit(locale, ...namespaces) as Promise<RKit<A, NL>>;
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
