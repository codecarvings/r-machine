/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/next, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

import { notFound } from "next/navigation";
import type { AnyLocale, AnyResourceAtlas, Namespace, NamespaceList, RKit, RMachine } from "r-machine";
import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "r-machine/errors";
import { getCanonicalUnicodeLocaleId } from "r-machine/locale";
import { cache, type ReactNode } from "react";
import type { AnyPathAtlas, BoundPathComposer, RMachineProxy } from "#r-machine/next/core";
import { ERR_LOCALE_BIND_CONFLICT, ERR_LOCALE_UNDETERMINED } from "#r-machine/next/errors";
import { type CookiesFn, type HeadersFn, validateServerOnlyUsage } from "#r-machine/next/internal";
import type { NextAppClientRMachine } from "./next-app-client-toolset.js";
import { localeHeaderName } from "./next-app-strategy-core.js";

export interface NextAppServerToolset<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  PA extends AnyPathAtlas,
  LK extends string,
> {
  readonly rMachineProxy: RMachineProxy;
  readonly NextServerRMachine: NextAppServerRMachine;
  readonly generateLocaleStaticParams: LocaleStaticParamsGenerator<LK>;
  readonly bindLocale: BindLocale<L, LK>;
  readonly getLocale: () => Promise<L>;
  readonly setLocale: (newLocale: L) => Promise<void>;
  readonly pickR: <N extends Namespace<RA>>(namespace: N) => Promise<RA[N]>;
  readonly pickRKit: <NL extends NamespaceList<RA>>(...namespaces: NL) => Promise<RKit<RA, NL>>;
  readonly getPathComposer: BoundPathComposerSupplier<PA>;
}

type BoundPathComposerSupplier<PA extends AnyPathAtlas> = () => Promise<BoundPathComposer<PA>>;

type RMachineParams<LK extends string> = {
  [P in LK]: AnyLocale;
};

export type NextAppServerRMachine = (props: NextAppServerRMachineProps) => Promise<ReactNode>;
interface NextAppServerRMachineProps {
  readonly children: ReactNode;
}

export interface NextAppServerImpl<L extends AnyLocale> {
  readonly localeKey: string;
  readonly autoLocaleBinding: boolean;
  readonly writeLocale: (
    locale: L | undefined,
    newLocale: L,
    cookies: CookiesFn,
    headers: HeadersFn
  ) => void | Promise<void>;
  // must be dynamically generated because of strategy options (localeLabel)
  readonly createLocaleStaticParamsGenerator: () =>
    | LocaleStaticParamsGenerator<string>
    | Promise<LocaleStaticParamsGenerator<string>>;
  readonly createProxy: () => RMachineProxy | Promise<RMachineProxy>;
  readonly createBoundPathComposerSupplier: (
    getLocale: () => Promise<L>
  ) => BoundPathComposerSupplier<AnyPathAtlas> | Promise<BoundPathComposerSupplier<AnyPathAtlas>>;
}

type LocaleStaticParamsGenerator<LK extends string> = () => Promise<RMachineParams<LK>>;

interface BindLocale<L extends AnyLocale, LK extends string> {
  (locale: AnyLocale): L;
  <P extends RMachineParams<LK>>(params: Promise<P>): Promise<P>;
}

interface NextAppServerRMachineContext<L extends AnyLocale> {
  value: L | null;
  getSafeLocalePromise: Promise<L> | null;
  getUnsafeLocalePromise: Promise<L | undefined> | null;
}

export async function createNextAppServerToolset<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  PA extends AnyPathAtlas,
  LK extends string,
>(
  rMachine: RMachine<RA, L>,
  impl: NextAppServerImpl<L>,
  NextClientRMachine: NextAppClientRMachine<L>
): Promise<NextAppServerToolset<RA, L, PA, LK>> {
  const localeKey = impl.localeKey as LK;
  const { autoLocaleBinding } = impl;

  const validateLocale = rMachine.localeHelper.validateLocale;

  // Use dynamic import to bypass the "next/headers" import issue in pages/ directory
  // You're importing a component that needs "next/headers". That only works in a Server Component which is not supported in the pages/ directory. Read more: https://nextjs.org/docs/app/building-your-application/rendering/server-components
  const { cookies, headers } = await import("next/headers");

  const rMachineProxy = await impl.createProxy();
  const generateLocaleStaticParams = await impl.createLocaleStaticParamsGenerator();

  const getContext = cache((): NextAppServerRMachineContext<L> => {
    return {
      value: null,
      getSafeLocalePromise: null,
      getUnsafeLocalePromise: null,
    };
  });

  async function NextServerRMachine({ children }: NextAppServerRMachineProps) {
    validateServerOnlyUsage("NextServerRMachine");
    return <NextClientRMachine locale={await getLocale()}>{children}</NextClientRMachine>;
  }

  const localeCache = new Map<AnyLocale, L>();
  function bindLocale(locale: AnyLocale | Promise<RMachineParams<LK>>) {
    validateServerOnlyUsage("bindLocale");

    function syncBindLocale(localeOption: AnyLocale): L {
      let locale = localeCache.get(localeOption);
      if (locale === undefined) {
        locale = getCanonicalUnicodeLocaleId(localeOption) as L;
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
          throw new RMachineUsageError(
            ERR_LOCALE_BIND_CONFLICT,
            `Locale bound multiple times with different values in the same request. Previous: "${context.value}", New: "${locale}".`
          );
        }
      }

      context.value = locale as L;
      return locale as L;
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

  function getSafeLocale(): L | Promise<L> {
    const context = getContext();
    if (context.value !== null) {
      return context.value;
    }

    if (autoLocaleBinding) {
      if (context.getSafeLocalePromise !== null) {
        return context.getSafeLocalePromise;
      }

      context.getSafeLocalePromise = headers().then((headersList) => {
        context.getSafeLocalePromise = null;

        const locale = headersList.get(localeHeaderName);
        if (locale === null) {
          throw new RMachineUsageError(
            ERR_LOCALE_UNDETERMINED,
            "Cannot determine locale. Ensure that the RMachine proxy is properly configured and applied."
          );
        }
        context.value = locale as L;
        return locale as L;
      });
      return context.getSafeLocalePromise;
    } else {
      throw new RMachineUsageError(
        ERR_LOCALE_UNDETERMINED,
        "Cannot determine locale. bindLocale function not invoked? (you must invoke bindLocale at the beginning of every page or layout component)."
      );
    }
  }

  function getUnsafeLocale(): L | undefined | Promise<L | undefined> {
    const context = getContext();
    if (context.value !== null) {
      return context.value;
    }

    if (autoLocaleBinding) {
      if (context.getUnsafeLocalePromise !== null) {
        return context.getUnsafeLocalePromise;
      }

      context.getUnsafeLocalePromise = headers().then((headersList) => {
        context.getUnsafeLocalePromise = null;
        return (headersList.get(localeHeaderName) || undefined) as L | undefined;
      });
      return context.getUnsafeLocalePromise;
    } else {
      return undefined;
    }
  }

  function getLocale(): Promise<L> {
    validateServerOnlyUsage("getLocale");

    const localeOrPromise = getSafeLocale();
    if (localeOrPromise instanceof Promise) {
      return localeOrPromise;
    } else {
      return Promise.resolve(localeOrPromise);
    }
  }

  async function setLocale(newLocale: L) {
    validateServerOnlyUsage("setLocale");

    const error = validateLocale(newLocale);
    if (error) {
      throw new RMachineUsageError(ERR_UNKNOWN_LOCALE, `Cannot set locale to invalid locale: "${newLocale}".`, error);
    }

    const locale = await getUnsafeLocale();
    await impl.writeLocale(locale, newLocale, cookies, headers);
  }

  function pickR<N extends Namespace<RA>>(namespace: N): Promise<RA[N]> {
    validateServerOnlyUsage("pickR");

    const localeOrPromise = getSafeLocale();
    if (localeOrPromise instanceof Promise) {
      return localeOrPromise.then((locale) => rMachine.pickR(locale, namespace));
    } else {
      return rMachine.pickR(localeOrPromise, namespace);
    }
  }

  function pickRKit<NL extends NamespaceList<RA>>(...namespaces: NL): Promise<RKit<RA, NL>> {
    validateServerOnlyUsage("pickRKit");

    const localeOrPromise = getSafeLocale();
    if (localeOrPromise instanceof Promise) {
      return localeOrPromise.then((locale) => rMachine.pickRKit(locale, ...namespaces)) as Promise<RKit<RA, NL>>;
    } else {
      return rMachine.pickRKit(localeOrPromise, ...namespaces) as Promise<RKit<RA, NL>>;
    }
  }

  const getPathComposer = await impl.createBoundPathComposerSupplier(getLocale);

  return {
    rMachineProxy,
    NextServerRMachine,
    generateLocaleStaticParams: generateLocaleStaticParams as LocaleStaticParamsGenerator<LK>,
    bindLocale: bindLocale as BindLocale<L, LK>,
    getLocale,
    setLocale,
    pickR,
    pickRKit,
    getPathComposer,
  };
}
