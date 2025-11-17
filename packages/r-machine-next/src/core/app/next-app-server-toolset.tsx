import { notFound } from "next/navigation";

import type { AnyAtlas, AtlasNamespace, AtlasNamespaceList, RKit, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { getCanonicalUnicodeLocaleId } from "r-machine/locale";
import { cache, type ReactNode } from "react";
import type { NextClientRMachine, RMachineProxy } from "#r-machine/next/core";
import type { CookiesFn, HeadersFn } from "#r-machine/next/internal";

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

export type EntrancePage = () => Promise<ReactNode>;

type LocaleStaticParamsGenerator<LK extends string> = () => Promise<RMachineParams<LK>[]>;

interface BindLocale<LK extends string> {
  (locale: string): string;
  <P extends RMachineParams<LK>>(params: Promise<P>): Promise<P>;
}

interface NextAppServerRMachineContext {
  value: string | null;
  getLocalePromise: Promise<string> | null;
}

export const localeHeaderName = "x-rm-locale";

export type NextAppServerImpl<LK extends string> = {
  readonly localeKey: LK;
  readonly autoLocaleBinding: boolean;
  readonly writeLocale: (newLocale: string, cookies: CookiesFn, headers: HeadersFn) => void | Promise<void>;
  // must be dynamically generated because of strategy options (lowercaseLocale)
  readonly createLocaleStaticParamsGenerator: () =>
    | LocaleStaticParamsGenerator<string>
    | Promise<LocaleStaticParamsGenerator<string>>;
  readonly createProxy: () => RMachineProxy | Promise<RMachineProxy>;
  readonly createEntrancePage: (
    headers: HeadersFn,
    cookies: CookiesFn,
    setLocale: (newLocale: string) => Promise<void>
  ) => EntrancePage | Promise<EntrancePage>;
};

export async function createNextAppServerToolset<A extends AnyAtlas, LK extends string>(
  rMachine: RMachine<A>,
  impl: NextAppServerImpl<LK>,
  NextClientRMachine: NextClientRMachine
): Promise<NextAppServerToolset<A, LK>> {
  const validateLocale = rMachine.localeHelper.validateLocale;
  const { localeKey, autoLocaleBinding } = impl;

  // Use dynamic import to bypass the "next/headers" import issue in pages/ directory
  // You're importing a component that needs "next/headers". That only works in a Server Component which is not supported in the pages/ directory. Read more: https://nextjs.org/docs/app/building-your-application/rendering/server-components
  const { headers, cookies } = await import("next/headers");

  const rMachineProxy = await impl.createProxy();
  const generateLocaleStaticParams = await impl.createLocaleStaticParamsGenerator();

  const getContext = cache((): NextAppServerRMachineContext => {
    return {
      value: null,
      getLocalePromise: null,
    };
  });

  async function NextServerRMachine({ children }: NextAppServerRMachineProps) {
    return <NextClientRMachine locale={await getLocale()}>{children}</NextClientRMachine>;
  }

  NextServerRMachine.EntrancePage = await impl.createEntrancePage(headers, cookies, setLocale);

  const localeCache = new Map<string, string>();
  function bindLocale(locale: string | Promise<RMachineParams<LK>>) {
    function syncBindLocale(localeOption: string): string {
      let locale = localeCache.get(localeOption);
      if (locale === undefined) {
        locale = getCanonicalUnicodeLocaleId(localeOption);
        const validationError = validateLocale(locale);
        if (validationError === null) {
          localeCache.set(localeOption, locale);
        } else {
          // Invalid locale, trigger 404
          notFound();
        }
      }

      const context = getContext();
      if (context.value !== null) {
        if (locale !== context.value) {
          throw new RMachineError(
            `Locale bound multiple times with different values in the same request. Previous: "${context.value}", New: "${locale}".`
          );
        }
      }

      context.value = locale;
      return locale;
    }

    async function asyncBindLocale(localePromise: Promise<RMachineParams<LK>>) {
      const params = await localePromise;
      params[localeKey] = syncBindLocale(params[localeKey]);
      return params;
    }

    if (locale instanceof Promise) {
      return asyncBindLocale(locale);
    } else {
      return syncBindLocale(locale);
    }
  }

  function internalGetLocale(): string | Promise<string> {
    const context = getContext();
    if (context.value !== null) {
      return context.value;
    }

    if (autoLocaleBinding) {
      if (context.getLocalePromise !== null) {
        return context.getLocalePromise;
      }

      context.getLocalePromise = headers().then((headersList) => {
        context.getLocalePromise = null;

        const locale = headersList.get(localeHeaderName);
        if (locale === null) {
          throw new RMachineError(
            "Cannot determine locale. Ensure that the RMachine proxy is properly configured and applied."
          );
        }
        context.value = locale;
        return locale;
      });
      return context.getLocalePromise;
    } else {
      throw new RMachineError(
        "Cannot determine locale. bindLocale not invoked? (you must invoke bindLocale at the beginning of every page or layout component)."
      );
    }
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

    await impl.writeLocale(newLocale, cookies, headers);
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
