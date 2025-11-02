import { notFound } from "next/navigation";
import type { NextMiddleware } from "next/server";
import type { AnyAtlas, AtlasNamespace, AtlasNamespaceList, RKit, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { cache, type JSX, type ReactNode } from "react";
import type { NextClientRMachine } from "#r-machine/next/core";
import { NextAppEntrancePage } from "./next-app-entrance-page.js";

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

export interface NextAppServerToolset<A extends AnyAtlas, LK extends string> {
  readonly NextServerRMachine: NextAppServerRMachine;
  readonly EntrancePage: EntrancePage;
  readonly generateLocaleStaticParams: LocaleStaticParamsGenerator<LK>;
  readonly bindLocale: BindLocale<LK>;
  readonly getLocale: () => string;
  readonly setLocale: (newLocale: string) => void;
  readonly pickR: <N extends AtlasNamespace<A>>(namespace: N) => Promise<A[N]>;
  readonly pickRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => Promise<RKit<A, NL>>;
}

interface BindLocale<LK extends string> {
  (locale: string): string;
  <P extends RMachineParams<LK>>(params: Promise<P>): Promise<P>;
}

type RMachineParams<LK extends string> = {
  [P in LK]: string;
};

interface NextAppServerRMachineProps {
  readonly children: ReactNode;
}
export type NextAppServerRMachine = (props: NextAppServerRMachineProps) => JSX.Element;

type LocaleStaticParamsGenerator<LK extends string> = () => Promise<RMachineParams<LK>[]>;

interface EntrancePageProps {
  readonly locale?: string | undefined | null;
}
type EntrancePage = (props: EntrancePageProps) => Promise<JSX.Element>;

interface NextAppServerRMachineContext {
  value: string | null;
}

export type NextAppServerImpl = {
  readonly writeLocale: (newLocale: string) => void;
};

export function createNextAppServerToolset<A extends AnyAtlas, LK extends string>(
  rMachine: RMachine<A>,
  impl: NextAppServerImpl,
  localeKey: LK,
  NextClientRMachine: NextClientRMachine
): NextAppServerToolset<A, LK> {
  const validateLocale = rMachine.localeHelper.validateLocale;

  const getContext = cache((): NextAppServerRMachineContext => {
    return {
      value: null,
    };
  });

  function NextServerRMachine({ children }: NextAppServerRMachineProps) {
    return <NextClientRMachine locale={getLocale()}>{children}</NextClientRMachine>;
  }

  async function EntrancePage({ locale }: EntrancePageProps) {
    // Workaround for typescript error:
    // NextAppEntrancePage' cannot be used as a JSX component. Its return type 'Promise<void>' is not a valid JSX element.
    return (
      <>
        {/* @ts-expect-error Async Server Component */}
        <NextAppEntrancePage rMachine={rMachine} locale={locale ?? undefined} setLocale={setLocale} />
      </>
    );
  }

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

  function getLocale(): string {
    const context = getContext();
    if (context.value === null) {
      throw new RMachineError(
        "NextAppServerRMachineContext not initialized. bindLocale not invoked? (you must invoke bindLocale at the beginning of every page or layout component)."
      );
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
    return rMachine.pickR(getLocale(), namespace) as Promise<A[N]>;
  }

  async function pickRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): Promise<RKit<A, NL>> {
    return rMachine.pickRKit(getLocale(), ...namespaces) as Promise<RKit<A, NL>>;
  }

  return {
    NextServerRMachine,
    EntrancePage,
    generateLocaleStaticParams: generateLocaleStaticParams as LocaleStaticParamsGenerator<LK>,
    bindLocale: bindLocale as BindLocale<LK>,
    getLocale,
    setLocale,
    pickR,
    pickRKit,
  };
}
