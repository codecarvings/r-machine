import { notFound } from "next/navigation";
import type { NextMiddleware } from "next/server";
import type { AnyAtlas, AtlasNamespace, AtlasNamespaceList, RKit, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { cache, type JSX, type ReactNode } from "react";
import type { NextClientRMachine } from "#r-machine/next/core";
import { getLocaleFromRMachineHeader } from "./next-app-server-toolset.server.js";

export interface NextAppServerToolset<A extends AnyAtlas, LK extends string> {
  readonly rMachineProxy: RMachineProxy;
  readonly NextServerRMachine: NextAppServerRMachine;
  readonly generateLocaleStaticParams: LocaleStaticParamsGenerator<LK>;
  readonly bindLocale: BindLocale<LK>;
  readonly getLocale: () => string | Promise<string>;
  readonly setLocale: (newLocale: string) => void;
  readonly pickR: <N extends AtlasNamespace<A>>(namespace: N) => Promise<A[N]>;
  readonly pickRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => Promise<RKit<A, NL>>;
}

export interface RMachineProxy extends NextMiddleware {
  readonly chain: (previousProxy: RMachineProxy) => NextMiddleware;
}

/*
  function rMachineProxy(request: NextRequest): ReturnType<NextMiddleware> {
    // const bin = implPackage.binFactories.readLocale({ strategyConfig, rMachine, request });
    //const locale = implPackage.impl.readLocale(bin);
    request.headers.set(localeHeaderName, "en");
  }

  rMachineProxy.chain = (followingProxy: RMachineProxy): NextMiddleware => {
    return (request: NextRequest, event: NextFetchEvent) => {
      rMachineProxy(request);
      return followingProxy(request, event);
    };
  };
*/

type RMachineParams<LK extends string> = {
  [P in LK]: string;
};

interface NextAppServerRMachineProps {
  readonly children: ReactNode;
}
export interface NextAppServerRMachine {
  (props: NextAppServerRMachineProps): Promise<JSX.Element>;
  readonly EntrancePage: EntrancePage;
}

export interface EntrancePageProps {
  readonly locale?: string | undefined | null;
}
export type EntrancePage = (props: EntrancePageProps) => Promise<JSX.Element>;

type LocaleStaticParamsGenerator<LK extends string> = () => Promise<RMachineParams<LK>[]>;

interface BindLocale<LK extends string> {
  (locale: string): string;
  <P extends RMachineParams<LK>>(params: Promise<P>): Promise<P>;
}

interface NextAppServerRMachineContext {
  value: string | null;
}

const ErrorEntrancePage: EntrancePage = async () => {
  throw new RMachineError("EntrancePage implementation is not available for the current strategy options.");
};

export type NextAppServerImpl = {
  readonly writeLocale: (newLocale: string) => void;
  readonly createProxy: () => RMachineProxy;
  readonly createEntrancePage?: ((setLocale: (newLocale: string) => void) => EntrancePage) | undefined;
};

export function createNextAppServerToolset<A extends AnyAtlas, LK extends string>(
  rMachine: RMachine<A>,
  impl: NextAppServerImpl,
  localeKey: LK,
  NextClientRMachine: NextClientRMachine
): NextAppServerToolset<A, LK> {
  const validateLocale = rMachine.localeHelper.validateLocale;

  const rMachineProxy = impl.createProxy();

  const getContext = cache((): NextAppServerRMachineContext => {
    return {
      value: null,
    };
  });

  async function NextServerRMachine({ children }: NextAppServerRMachineProps) {
    return <NextClientRMachine locale={await getLocale()}>{children}</NextClientRMachine>;
  }

  NextServerRMachine.EntrancePage =
    impl.createEntrancePage !== undefined ? impl.createEntrancePage(setLocale) : ErrorEntrancePage;

  async function generateLocaleStaticParams() {
    return rMachine.config.locales.map((locale) => ({
      [localeKey]: locale,
    }));
  }

  function bindLocale(locale: string | Promise<RMachineParams<LK>>) {
    function syncBindLocale(locale: string): void {
      const validationError = validateLocale(locale);
      if (validationError !== null) {
        // Invalid locale, trigger 404
        notFound();
      }

      const context = getContext();
      if (context.value !== null) {
        if (locale !== context.value) {
          throw new RMachineError(
            `bindLocale called multiple times with different locales in the same request. Previous: "${context.value}", New: "${locale}".`
          );
        }
      }

      context.value = locale;
    }

    async function asyncBindLocale(localePromise: Promise<RMachineParams<LK>>) {
      const params = await localePromise;
      syncBindLocale(params[localeKey]);
      return params;
    }

    if (locale instanceof Promise) {
      return asyncBindLocale(locale);
    } else {
      syncBindLocale(locale);
      return locale;
    }
  }

  function getLocale(): string | Promise<string> {
    const context = getContext();
    if (context.value === null) {
      // TODO: Handle racing conditions !!!
      return getLocaleFromRMachineHeader(rMachine).then((locale) => {
        console.log("Determined locale from header:", locale);
        context.value = locale;
        return locale;
      });

      /*
      throw new RMachineError(
        "NextAppServerRMachineContext not initialized. bindLocale not invoked? (you must invoke bindLocale at the beginning of every page or layout component)."
      );
      */
    }
    return context.value;
  }

  function setLocale(newLocale: string) {
    const error = validateLocale(newLocale);
    if (error) {
      throw new RMachineError(`Cannot set locale to invalid locale: "${newLocale}".`, error);
    }

    impl.writeLocale(newLocale);
  }

  async function pickR<N extends AtlasNamespace<A>>(namespace: N): Promise<A[N]> {
    const localeOrPromise = getLocale();
    const locale = localeOrPromise instanceof Promise ? await localeOrPromise : localeOrPromise;
    return rMachine.pickR(locale, namespace) as Promise<A[N]>;
  }

  async function pickRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): Promise<RKit<A, NL>> {
    const localeOrPromise = getLocale();
    const locale = localeOrPromise instanceof Promise ? await localeOrPromise : localeOrPromise;
    return rMachine.pickRKit(locale, ...namespaces) as Promise<RKit<A, NL>>;
  }

  return {
    rMachineProxy,
    NextServerRMachine,
    generateLocaleStaticParams: generateLocaleStaticParams as LocaleStaticParamsGenerator<LK>,
    bindLocale: bindLocale as BindLocale<LK>,
    getLocale,
    setLocale,
    pickR,
    pickRKit,
  };
}
