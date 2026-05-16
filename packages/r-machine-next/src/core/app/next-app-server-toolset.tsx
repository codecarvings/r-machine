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
import type { RMachine } from "r-machine";
import type {
  AnyPlugHead,
  AnyResAtlas,
  ExperimentalFlags,
  HandleList,
  HandleMap,
  NamespaceList,
  PluginCtxAugmenter,
  ResEquipment,
} from "r-machine/core";
import { createPlug, createRequestScope, getNamespaceList, getNamespaceMap, getPlugOutline } from "r-machine/core";
import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "r-machine/errors";
import { type AnyLocale, getCanonicalUnicodeLocaleId } from "r-machine/locale";
import { cache, type ReactNode } from "react";
import type {
  AnyPathAtlas,
  BoundPathComposer,
  NextServerPlugDefiner,
  NextServerPlugKitMap,
  RMachineProxy,
} from "#r-machine/next/core";
import { ERR_LOCALE_BIND_CONFLICT, ERR_LOCALE_UNDETERMINED } from "#r-machine/next/errors";
import { type CookiesFn, type HeadersFn, validateServerOnlyUsage } from "#r-machine/next/internal";
import type { NextAppClientRMachine } from "./next-app-client-toolset.js";
import { localeHeaderName } from "./next-app-strategy-core.js";

export interface NextAppServerToolset<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> {
  readonly rMachineProxy: RMachineProxy;
  readonly NextServerRMachine: NextAppServerRMachine;
  readonly generateLocaleStaticParams: LocaleStaticParamsGenerator<LK>;
  readonly bindLocale: BindLocale<L, LK>;
  readonly setLocale: (newLocale: L) => Promise<void>;
  readonly ServerPlug: NextServerPlugDefiner<RA, L, SKM, PA, LK>;
}

type RMachineParams<LK extends string> = {
  [P in LK]: AnyLocale;
};

export type NextAppServerRMachine = (props: NextAppServerRMachineProps) => Promise<ReactNode>;
interface NextAppServerRMachineProps {
  readonly children: ReactNode;
}

export interface NextAppServerImpl<L extends AnyLocale, LK extends string> {
  readonly localeKey: LK;
  readonly autoLocaleBinding: boolean;
  readonly writeLocale: (
    locale: L | undefined,
    newLocale: L,
    cookies: CookiesFn,
    headers: HeadersFn
  ) => void | Promise<void>;
  // must be dynamically generated because of strategy options (localeLabel)
  readonly createLocaleStaticParamsGenerator: () =>
    | LocaleStaticParamsGenerator<LK>
    | Promise<LocaleStaticParamsGenerator<LK>>;
  readonly createProxy: () => RMachineProxy | Promise<RMachineProxy>;
  readonly createPathComposer: (locale: L) => BoundPathComposer<AnyPathAtlas>;
}

export type LocaleStaticParamsGenerator<LK extends string> = () => Promise<RMachineParams<LK>[]>;

interface BindLocale<L extends AnyLocale, LK extends string> {
  <P extends RMachineParams<LK>>(params: Promise<P>): Promise<P>;
  (locale: AnyLocale): L;
}

interface NextAppServerRMachineContext<L extends AnyLocale> {
  value: L | null;
  getLocalePromise: Promise<L> | null;
}

export async function createNextAppServerToolset<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends ResEquipment<RA>,
  EF extends ExperimentalFlags,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
>(
  rMachine: RMachine<RA, L, E, EF>,
  serverKit: SKM,
  impl: NextAppServerImpl<L, LK>,
  NextClientRMachine: NextAppClientRMachine<L>
): Promise<NextAppServerToolset<RA, L, SKM, PA, LK>> {
  const localeKey = impl.localeKey as LK;
  const { autoLocaleBinding } = impl;

  const validateLocale = rMachine.localeHelper.validateLocale;

  // Dynamic import to bypass the "next/headers" import issue in pages/ directory
  // (next/headers only works in Server Components / App Router).
  const { cookies, headers } = await import("next/headers");

  // Dynamic import: the request-scope and scope-registry modules are
  // server-side coordination plumbing. The provider is installed on the
  // rMachine once at toolset construction; per-request entry/dispose happens
  // inside `NextServerRMachine` below.
  const { nextRequestScopeProvider } = await import("./request-scope.js");
  const { registerScope, unregisterScope } = await import("./scope-registry.js");

  const rMachineProxy = await impl.createProxy();
  const generateLocaleStaticParams = await impl.createLocaleStaticParamsGenerator();

  // Install the ALS-backed scope provider on the shared RMachine. The JM
  // will now route Outer/Vertex slot resolutions to a per-request map when
  // one is active (see `NextServerRMachine` below). Base/Inner/Shell stay
  // process-cached and unaffected. A single toolset construction per Next
  // app process is assumed; subsequent installs replace the previous
  // provider, which is fine for hot-reload but indicates a misuse in
  // production.
  rMachine.requestScope.installProvider(nextRequestScopeProvider);

  const getContext = cache((): NextAppServerRMachineContext<L> => {
    return {
      value: null,
      getLocalePromise: null,
    };
  });

  function getLocale(): L | Promise<L> {
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
          throw new RMachineUsageError(
            ERR_LOCALE_UNDETERMINED,
            "Cannot determine locale. Ensure that the RMachine proxy is properly configured and applied."
          );
        }
        context.value = locale as L;
        return locale as L;
      });
      return context.getLocalePromise;
    } else {
      throw new RMachineUsageError(
        ERR_LOCALE_UNDETERMINED,
        "Cannot determine locale. bindLocale(locale | params) or ServerPlug.useR(locale | params) not invoked? (you must invoke bindLocale or ServerPlug.useR with a locale or route params at the beginning of every page or layout component)."
      );
    }
  }

  async function NextServerRMachine({ children }: NextAppServerRMachineProps) {
    validateServerOnlyUsage("NextServerRMachine");

    // Create a fresh request scope for this render. The scope holds the
    // OuterGear slot map plus per-Plug wireCaches; it's request-scoped so the
    // server's render-time `setInterval`s, action listeners, etc. get disposed
    // at end of response and don't leak across requests.
    //
    // The scope itself can't be passed as a prop to a client component (Maps
    // aren't serializable across the server→client boundary). Instead we
    // register it under a UUID and pass the UUID as a prop; the client
    // component (server-SSR'd in the same Node process) looks it back up via
    // `lookupScope` and exposes it through `RequestScopeContext` so
    // `useBareReactPlug` can install it as the JM scope-provider's override.
    const scope = createRequestScope();
    const scopeId = crypto.randomUUID();
    registerScope(scopeId, scope);

    // Dynamic import: `next/server` is only available in App Router server
    // contexts. Static import would fail at module load in Pages Router or
    // certain edge-runtime configurations.
    const { after } = await import("next/server");

    // Tear down at end-of-response. `after()` runs the callback after the
    // response has been streamed to the client. Wrapped in try/catch because
    // dispose is best-effort cleanup: a single broken teardown must not throw
    // out of `after()` and disturb other registered callbacks.
    after(() => {
      try {
        rMachine.requestScope.dispose(scope);
      } catch (e) {
        console.error("[r-machine/next] requestScope.dispose failed", e);
      }
      unregisterScope(scopeId);
    });

    return (
      <NextClientRMachine locale={await getLocale()} scopeId={scopeId}>
        {children}
      </NextClientRMachine>
    );
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

  function getValidLocale(localeOption: AnyLocale): L {
    let locale = localeCache.get(localeOption);
    if (locale === undefined) {
      locale = getCanonicalUnicodeLocaleId(localeOption) as L;
      const validationError = validateLocale(locale);
      if (validationError !== null) {
        throw validationError;
      }
      localeCache.set(localeOption, locale);
    }
    return locale as L;
  }

  async function setLocale(newLocale: L) {
    validateServerOnlyUsage("setLocale");

    const error = validateLocale(newLocale);
    if (error) {
      throw new RMachineUsageError(ERR_UNKNOWN_LOCALE, `Cannot set locale to invalid locale: "${newLocale}".`, error);
    }

    await impl.writeLocale(undefined!, newLocale, cookies, headers);
  }

  const ServerPlug = ((...args: unknown[]) => {
    const outline = getPlugOutline<AnyResAtlas>(...args);

    const isList = outline.mode === "list";
    const nsDeps = isList
      ? getNamespaceList(outline.deps as HandleList<AnyResAtlas>)
      : getNamespaceMap(outline.deps as HandleMap<AnyResAtlas>);

    const head = {
      realm: "gate",
      mode: outline.mode,
      deps: outline.deps,
      nsDeps,
      nsDepList: isList ? [...(nsDeps as NamespaceList<AnyResAtlas>)] : Object.values(nsDeps),
    };

    const body = createPlug(head as unknown as AnyPlugHead);

    const resolvePlugin = async (locale: L, resolvedParams?: Record<string, unknown>) => {
      const augmentCtx: PluginCtxAugmenter = ($) => {
        $.locale = locale;
        $.getPath = impl.createPathComposer(locale);
        $.setLocale = async (newLocale: L): Promise<void> => {
          const error = validateLocale(newLocale);
          if (error) {
            throw new RMachineUsageError(ERR_UNKNOWN_LOCALE, `Cannot set invalid locale: "${newLocale}".`, error);
          }
          await impl.writeLocale(locale, newLocale, cookies, headers);
        };
        if (resolvedParams !== undefined) {
          $.params = resolvedParams;
        }
      };

      return await rMachine.getGatePlugin(serverKit, nsDeps, locale, augmentCtx);
    };

    const useR = async (firstArg?: unknown): Promise<unknown> => {
      validateServerOnlyUsage("ServerPlug.useR");

      let locale: L;
      let resolvedParams: Record<string, unknown> | undefined;

      if (firstArg === undefined) {
        // Overload 1: useR() — locale auto from getLocale
        locale = await getLocale();
      } else if (firstArg instanceof Promise) {
        // Overload 2: useR(params) — binds locale from route params
        resolvedParams = (await firstArg) as Record<string, unknown>;
        locale = bindLocale(resolvedParams[localeKey] as AnyLocale) as L;
      } else {
        // Overload 3: useR(locale) — binds explicit locale
        locale = bindLocale(firstArg as AnyLocale) as L;
      }

      return resolvePlugin(locale, resolvedParams);
    };

    const useUnboundR = async (firstArg: unknown): Promise<unknown> => {
      validateServerOnlyUsage("ServerPlug.useUnboundR");

      let locale: L;
      let resolvedParams: Record<string, unknown> | undefined;

      if (firstArg instanceof Promise) {
        // Overload 1: useUnboundR(params) — uses param locale without binding
        resolvedParams = (await firstArg) as Record<string, unknown>;
        locale = getValidLocale(resolvedParams[localeKey] as AnyLocale) as L;
      } else {
        // Overload 2: useUnboundR(locale) — uses explicit locale without binding
        locale = getValidLocale(firstArg as AnyLocale) as L;
      }

      return resolvePlugin(locale, resolvedParams);
    };

    (body as unknown as { useR: typeof useR; useUnboundR: typeof useUnboundR }).useR = useR;
    (body as unknown as { useR: typeof useR; useUnboundR: typeof useUnboundR }).useUnboundR = useUnboundR;
    return body;
  }) as NextServerPlugDefiner<RA, L, SKM, PA, LK>;

  return {
    rMachineProxy,
    NextServerRMachine,
    generateLocaleStaticParams: generateLocaleStaticParams,
    bindLocale: bindLocale as BindLocale<L, LK>,
    setLocale,
    ServerPlug,
  };
}
