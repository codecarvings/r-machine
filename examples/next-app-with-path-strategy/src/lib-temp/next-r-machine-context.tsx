import {
  type AnyAtlas,
  type AtlasNamespace,
  type AtlasNamespaceList,
  type RKit,
  type RMachine,
  RMachineError,
} from "r-machine";
import type { ReactNode } from "react";
import { cache, type JSX } from "react";
import type { ReactRMachineProvider } from "react-r-machine";
import type { NextRMachineLocaleContextBridge } from "./next-r-machine-locale-context-bridge.js";

interface NextRMachineContextValue {
  readonly ready: true;
  readonly localeOption: string | undefined;
  readonly locale: string;
}

interface NextRMachineProviderProbeProps {
  readonly localeOption?: string | undefined;
}

interface NextRMachineProviderProps extends NextRMachineProviderProbeProps {
  readonly children: ReactNode;
}

interface NextRMachineProviderProbeResult<A extends AnyAtlas> {
  readonly locale: string | undefined;
  readonly rMachine: RMachine<A>;
}

export interface NextRMachineProvider<A extends AnyAtlas> {
  (props: NextRMachineProviderProps): JSX.Element;
  probe: (props: NextRMachineProviderProbeProps) => NextRMachineProviderProbeResult<A>;
}

interface NextRMachineContext<A extends AnyAtlas> {
  readonly NextRMachineProvider: NextRMachineProvider<A>;
  readonly getLocale: () => Promise<string>;
  readonly setLocale: (newLocale: string) => Promise<void>;
  readonly pickR: <N extends AtlasNamespace<A>>(namespace: N) => Promise<A[N]>;
  readonly pickRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => Promise<RKit<A, NL>>;
}

export function createNextRMachineContext<A extends AnyAtlas = AnyAtlas>(
  rMachine: RMachine<A>,
  localeBridge: NextRMachineLocaleContextBridge,
  ReactRMachineProvider: ReactRMachineProvider<A>
): NextRMachineContext<A> {
  const { getLocale: _getLocale, setLocale: _setLocale } = localeBridge;

  const getRawNextRMachineContext = cache((): NextRMachineContextValue => {
    return {} as any;
  });

  async function getNextRMachineContext(): Promise<NextRMachineContextValue> {
    const context = getRawNextRMachineContext();
    if (!context.ready) {
      throw new RMachineError("getNextRMachineContext must be invoked from within a ReactRMachineProvider");
    }
    return context;
  }

  function probe(localeOption: string | undefined): NextRMachineProviderProbeResult<A> {
    let locale = _getLocale({ localeOption, rMachine });
    if (locale !== undefined && rMachine.localeHelper.validateLocale(locale) !== null) {
      locale = undefined;
    }

    return {
      locale,
      rMachine,
    };
  }

  function NextRMachineProvider({ localeOption, children }: NextRMachineProviderProps) {
    const { locale } = probe(localeOption);
    if (locale === undefined) {
      throw new RMachineError(
        "Unable to render NextRMachineProvider - localeBridge.getLocale function cannot determine a valid locale"
      );
    }

    const context = getRawNextRMachineContext() as {
      -readonly [P in keyof NextRMachineContextValue]: NextRMachineContextValue[P];
    };
    context.ready = true;
    context.locale = locale;
    context.localeOption = localeOption;

    return <ReactRMachineProvider localeOption={localeOption}>{children}</ReactRMachineProvider>;
  }

  NextRMachineProvider.probe = (props?: NextRMachineProviderProbeProps) => {
    const { localeOption } = props || {};
    return probe(localeOption);
  };

  async function getLocale(): Promise<string> {
    const { locale } = await getNextRMachineContext();
    return locale;
  }

  async function setLocale(newLocale: string) {
    const { localeOption, locale } = await getNextRMachineContext();
    const error = rMachine.localeHelper.validateLocale(newLocale);
    if (error) {
      throw error;
    }

    _setLocale(newLocale, { localeOption, rMachine, currentLocale: locale });
  }

  async function pickR<N extends AtlasNamespace<A>>(namespace: N): Promise<A[N]> {
    const { locale } = await getNextRMachineContext();
    return rMachine.pickR(locale, namespace);
  }

  async function pickRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): Promise<RKit<A, NL>> {
    const { locale } = await getNextRMachineContext();
    return rMachine.pickRKit(locale, ...namespaces) as Promise<RKit<A, NL>>;
  }

  return {
    NextRMachineProvider,
    getLocale,
    setLocale,
    pickR,
    pickRKit,
  };
}
