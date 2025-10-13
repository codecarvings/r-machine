import {
  type AnyAtlas,
  type AtlasNamespace,
  type AtlasNamespaceList,
  type RKit,
  type RMachine,
  RMachineError,
} from "r-machine";
import type { ReactNode } from "react";
import { cache } from "react";
import type { NextAppRouterClientRMachine } from "./next-app-router-client-tools";
import { NextAppRouterStrategy } from "./next-app-router-strategy";

interface NextAppRouterServerTools<A extends AnyAtlas, LK extends string> {
  readonly NextServerRMachine: NextAppRouterServerRMachine;
  readonly applyLocale: (locale: string | undefined) => LK;
  readonly getLocale: () => string;
  readonly setLocale: (newLocale: string) => void;
  readonly pickR: <N extends AtlasNamespace<A>>(namespace: N) => Promise<A[N]>;
  readonly pickRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => Promise<RKit<A, NL>>;
}

interface NextAppRouterServerRMachineProps {
  readonly children: ReactNode;
}

export type NextAppRouterServerRMachine = (props: NextAppRouterServerRMachineProps) => JSX.Element;

interface NextAppRouterServerRMachineContext {
  value: string | null;
}

export function createNextAppRouterServerTools<A extends AnyAtlas, LK extends string>(
  rMachine: RMachine<A>,
  strategy: NextAppRouterStrategy<LK>,
  NextClientRMachine: NextAppRouterClientRMachine
): NextAppRouterServerTools<A, LK> {
  const { readLocale, writeLocale } = NextAppRouterStrategy.getNextStrategyImpl(strategy, rMachine);
  const validateLocale = rMachine.localeHelper.validateLocale;

  const getContext = cache((): NextAppRouterServerRMachineContext => {
    return {
      value: null,
    };
  });

  function NextServerRMachine({ children }: NextAppRouterServerRMachineProps) {
    const locale = getLocale();

    // Workaround for TypeScript's strict typing
    const UntypedNextClientRMachine = NextClientRMachine as any;
    return <UntypedNextClientRMachine locale={locale}>{children}</UntypedNextClientRMachine>;
  }

  function applyLocale(localeOption: string | undefined): LK {
    const locale = readLocale({ localeOption });
    if (locale === undefined) {
      throw new RMachineError("Unable to determine locale");
    }

    const error = validateLocale(locale);
    if (error) {
      throw new RMachineError(`Invalid locale provided to applyLocale "${locale}"`, error);
    }

    const context = getContext();
    if (context.value !== null) {
      if (locale !== context.value) {
        throw new RMachineError(
          `applyLocale called multiple times with different locales in the same request. Previous: "${context.value}", New: "${locale}"`
        );
      }
    }

    context.value = locale;
    return locale as any;
  }

  function getLocale(): string {
    const context = getContext();
    if (context.value === null) {
      throw new RMachineError(
        "NextAppRouterServerRMachineContext not initialized. applyLocale not invoked? (you must invoke applyLocale at the top of every page or layout)"
      );
    }
    return context.value;
  }

  function setLocale(newLocale: string) {
    const currentLocale = getLocale();
    if (newLocale === currentLocale) {
      return;
    }

    const error = rMachine.localeHelper.validateLocale(newLocale);
    if (error) {
      throw error;
    }

    writeLocale(newLocale, { currentLocale });
  }

  async function pickR<N extends AtlasNamespace<A>>(namespace: N): Promise<A[N]> {
    const locale = getLocale();
    return rMachine.pickR(locale, namespace) as Promise<A[N]>;
  }

  async function pickRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): Promise<RKit<A, NL>> {
    const locale = getLocale();
    return rMachine.pickRKit(locale, ...namespaces) as Promise<RKit<A, NL>>;
  }

  return {
    NextServerRMachine,
    applyLocale,
    getLocale,
    setLocale,
    pickR,
    pickRKit,
  };
}
