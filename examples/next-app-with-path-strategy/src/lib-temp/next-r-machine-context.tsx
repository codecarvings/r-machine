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
import type { NextRMachineContextLocaleBridge } from "./next-r-machine-context-locale-bridge.js";

interface NextRMachineContextValue {
  readonly ready: true;
  readonly locale: string;
}

interface NextRMachineProviderProps {
  readonly children: ReactNode;
}

export type NextRMachineProvider = (props: NextRMachineProviderProps) => JSX.Element;

interface NextRMachineContext<A extends AnyAtlas> {
  readonly NextRMachineProvider: NextRMachineProvider;
  readonly getLocale: () => Promise<string>;
  readonly setLocale: (newLocale: string) => Promise<void>;
  readonly pickR: <N extends AtlasNamespace<A>>(namespace: N) => Promise<A[N]>;
  readonly pickRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => Promise<RKit<A, NL>>;
}

export function createNextRMachineContext<A extends AnyAtlas = AnyAtlas>(
  rMachine: RMachine<A>,
  localeBridge: NextRMachineContextLocaleBridge,
  ReactRMachineProvider: ReactRMachineProvider<A>
): NextRMachineContext<A> {
  const { readLocale, writeLocale } = localeBridge;

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

  function NextRMachineProvider({ children }: NextRMachineProviderProps) {
    const locale = readLocale({ rMachine });
    if (locale === undefined) {
      throw new RMachineError(
        "Unable to render NextRMachineProvider - localeBridge.getLocale function cannot determine a valid locale (undefined)"
      );
    }
    const validationError = rMachine.localeHelper.validateLocale(locale);
    if (validationError) {
      throw new RMachineError(
        `Unable to render NextRMachineProvider - localeBridge.getLocale function returned an invalid locale ("${locale}")`,
        validationError
      );
    }

    const context = getRawNextRMachineContext() as {
      -readonly [P in keyof NextRMachineContextValue]: NextRMachineContextValue[P];
    };
    context.ready = true;
    context.locale = locale;

    return <ReactRMachineProvider localeOption={locale}>{children}</ReactRMachineProvider>;
  }

  async function getLocale(): Promise<string> {
    const { locale } = await getNextRMachineContext();
    return locale;
  }

  async function setLocale(newLocale: string) {
    const { locale } = await getNextRMachineContext();
    const error = rMachine.localeHelper.validateLocale(newLocale);
    if (error) {
      throw error;
    }

    writeLocale(newLocale, { currentLocale: locale, rMachine });
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
