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

type RMachineParams<LK extends string> = {
  [P in LK]: string;
};

interface BindLocale<LK extends string> {
  (locale: string, unsafe?: false): string;
  (params: Promise<RMachineParams<LK>>, unsafe?: false): Promise<string>;

  (locale: string, unsafe: true): string | undefined;
  (params: Promise<RMachineParams<LK>>, unsafe: true): Promise<string | undefined>;
}

interface NextAppRouterServerTools<A extends AnyAtlas, LK extends string> {
  readonly NextServerRMachine: NextAppRouterServerRMachine;
  readonly bindLocale: BindLocale<LK>;
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
  value: string | undefined | null;
}

export function createNextAppRouterServerTools<A extends AnyAtlas, LK extends string>(
  rMachine: RMachine<A>,
  strategy: NextAppRouterStrategy<any, LK>,
  NextClientRMachine: NextAppRouterClientRMachine
): NextAppRouterServerTools<A, LK> {
  const strategyConfig = NextAppRouterStrategy.getConfig(strategy);
  const { onBindLocaleError, writeLocale } = NextAppRouterStrategy.getNextStrategyServerImpl(strategy);
  const localeKey = NextAppRouterStrategy.getLocaleKey(strategy);
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

  function bindLocale(
    locale: string | Promise<RMachineParams<LK>>,
    unsafe?: boolean
  ): string | undefined | Promise<string | undefined> {
    function syncBindLocale(locale: string | undefined): string | undefined {
      let error: RMachineError | undefined;

      // If onBindLocale does not throw, the error is
      if (locale === undefined) {
        error = new RMachineError("Invalid locale provided to bindLocale: undefined");
      } else {
        const validationError = validateLocale(locale);
        if (validationError) {
          error = new RMachineError(`Invalid locale provided to bindLocale: "${locale}"`, validationError);
        }
      }

      if (error) {
        if (unsafe === true) {
          locale = undefined;
        } else {
          onBindLocaleError(error, { strategyConfig, rMachine, localeOption: locale });
          throw error;
        }
      }

      const context = getContext();
      if (context.value !== null) {
        if (locale !== context.value) {
          throw new RMachineError(
            `bindLocale called multiple times with different locales in the same request. Previous: "${context.value}", New: "${locale}"`
          );
        }
      }
      context.value = locale;
      return locale;
    }

    async function asyncBindLocale(localePromise: Promise<RMachineParams<LK>>): Promise<string | undefined> {
      const locale = (await localePromise)[localeKey];
      return syncBindLocale(locale);
    }

    if (locale instanceof Promise) {
      return asyncBindLocale(locale);
    } else {
      return syncBindLocale(locale);
    }
  }

  function getLocale(): string {
    const context = getContext();
    if (context.value === null) {
      throw new RMachineError(
        "NextAppRouterServerRMachineContext not initialized. bindLocale not invoked? (you must invoke bindLocale at the beginning of every page or layout component)"
      );
    } else if (context.value === undefined) {
      throw new RMachineError("Locale is undefined. Invalid value passed to bindLocale (safe mode disabled)");
    }
    return context.value;
  }

  function setLocale(newLocale: string) {
    const error = rMachine.localeHelper.validateLocale(newLocale);
    if (error) {
      throw error;
    }

    writeLocale(newLocale, { strategyConfig, rMachine });
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
    bindLocale: bindLocale as BindLocale<LK>,
    getLocale,
    setLocale,
    pickR,
    pickRKit,
  };
}
