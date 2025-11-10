import type { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import type { AnyAtlas, AtlasNamespace, AtlasNamespaceList, RKit, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { cache, type ReactNode } from "react";
import type { NextClientRMachine } from "#r-machine/next/core";

export interface NextAppServerToolset<A extends AnyAtlas, LK extends string> {
  readonly rMachineProxy: RMachineProxy;
  readonly NextServerRMachine: NextAppServerRMachine;
  readonly generateLocaleStaticParams: LocaleStaticParamsGenerator<LK>;
  readonly bindLocale: BindLocale<LK>;
  readonly getLocale: () => Promise<string>;
  readonly setLocale: (newLocale: string) => Promise<void>;
  readonly pickR: <N extends AtlasNamespace<A>>(namespace: N) => Promise<A[N]>;
  readonly pickRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => Promise<RKit<A, NL>>;
}

// biome-ignore lint/suspicious/noConfusingVoidType: Use exact type definition from Next.js
type NextProxyResult = NextResponse | Response | null | undefined | void;
type NextProxy = (request: NextRequest, event: NextFetchEvent) => NextProxyResult | Promise<NextProxyResult>;
export interface RMachineProxy extends NextProxy {
  readonly chain: (previousProxy: RMachineProxy) => NextProxy;
}

type RMachineParams<LK extends string> = {
  [P in LK]: string;
};

interface NextAppServerRMachineProps {
  readonly children: ReactNode;
}
export interface NextAppServerRMachine {
  (props: NextAppServerRMachineProps): Promise<ReactNode>;
  readonly EntrancePage: EntrancePage;
}

export interface EntrancePageProps {
  readonly locale?: string | undefined | null;
}
export type EntrancePage = (props: EntrancePageProps) => Promise<ReactNode>;

type LocaleStaticParamsGenerator<LK extends string> = () => Promise<RMachineParams<LK>[]>;

interface BindLocale<LK extends string> {
  (locale: string): string;
  <P extends RMachineParams<LK>>(params: Promise<P>): Promise<P>;
}

interface NextAppServerRMachineContext {
  value: string | null;
  getLocalePromise: Promise<string> | null;
}

const ErrorEntrancePage: EntrancePage = async () => {
  throw new RMachineError("EntrancePage implementation is not available for the current strategy options.");
};

export const localeHeaderName = "x-rm-locale";

type HeadersFn = typeof headers;
export type NextAppServerImpl = {
  readonly writeLocale: (newLocale: string) => void | Promise<void>;
  readonly createProxy: () => RMachineProxy | Promise<RMachineProxy>;
  readonly createEntrancePage?:
    | ((headers: HeadersFn, setLocale: (newLocale: string) => void) => EntrancePage | Promise<EntrancePage>)
    | undefined;
};

export async function createNextAppServerToolset<A extends AnyAtlas, LK extends string>(
  rMachine: RMachine<A>,
  impl: NextAppServerImpl,
  localeKey: LK,
  NextClientRMachine: NextClientRMachine
): Promise<NextAppServerToolset<A, LK>> {
  const validateLocale = rMachine.localeHelper.validateLocale;

  // Use dynamic import to bypass the "next/headers" import issue in pages/ directory
  // You're importing a component that needs "next/headers". That only works in a Server Component which is not supported in the pages/ directory. Read more: https://nextjs.org/docs/app/building-your-application/rendering/server-components
  const { headers } = await import("next/headers");

  const rMachineProxy = await impl.createProxy();

  const getContext = cache((): NextAppServerRMachineContext => {
    return {
      value: null,
      getLocalePromise: null,
    };
  });

  async function NextServerRMachine({ children }: NextAppServerRMachineProps) {
    return <NextClientRMachine locale={await getLocale()}>{children}</NextClientRMachine>;
  }

  NextServerRMachine.EntrancePage =
    impl.createEntrancePage !== undefined ? await impl.createEntrancePage(headers, setLocale) : ErrorEntrancePage;

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

  function internalGetLocale(): string | Promise<string> {
    const context = getContext();
    if (context.value !== null) {
      return context.value;
    }
    if (context.getLocalePromise !== null) {
      return context.getLocalePromise;
    }

    context.getLocalePromise = headers().then((headersList) => {
      context.getLocalePromise = null;

      const locale = headersList.get(localeHeaderName);
      if (locale === null) {
        throw new RMachineError(
          "TODO: Write error message for missing locale header in NextAppServerRMachineContext.getLocale."
        );
      }
      console.log("Determined locale from header:", locale);
      context.value = locale;
      return locale;
    });
    return context.getLocalePromise;
    /*
    throw new RMachineError(
      "NextAppServerRMachineContext not initialized. bindLocale not invoked? (you must invoke bindLocale at the beginning of every page or layout component)."
    );
    */
  }

  function getLocale(): Promise<string> {
    const localeOrPromise = internalGetLocale();
    if (localeOrPromise instanceof Promise) {
      return localeOrPromise;
    } else {
      return Promise.resolve(localeOrPromise);
    }
  }

  async function setLocale(newLocale: string) {
    const error = validateLocale(newLocale);
    if (error) {
      throw new RMachineError(`Cannot set locale to invalid locale: "${newLocale}".`, error);
    }

    await impl.writeLocale(newLocale);
  }

  function pickR<N extends AtlasNamespace<A>>(namespace: N): Promise<A[N]> {
    const localeOrPromise = internalGetLocale();
    if (localeOrPromise instanceof Promise) {
      return localeOrPromise.then((locale) => rMachine.pickR(locale, namespace));
    } else {
      return rMachine.pickR(localeOrPromise, namespace);
    }
  }

  function pickRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): Promise<RKit<A, NL>> {
    const localeOrPromise = internalGetLocale();
    if (localeOrPromise instanceof Promise) {
      return localeOrPromise.then((locale) => rMachine.pickRKit(locale, ...namespaces)) as Promise<RKit<A, NL>>;
    } else {
      return rMachine.pickRKit(localeOrPromise, ...namespaces) as Promise<RKit<A, NL>>;
    }
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
