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

"use client";

import type { VertexFrameType } from "@r-machine/react/core";
import { type CreateReactBareToolsetOptions, createReactBareToolset, RequestScopeContext } from "@r-machine/react/core";
import { usePathname, useRouter } from "next/navigation";
import type { RMachine } from "r-machine";
import type { AnyResAtlas, AnyResEquipment, ExperimentalFlags } from "r-machine/core";
import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "r-machine/errors";
import type { AnyLocale } from "r-machine/locale";
import { type ReactNode, useEffect, useRef } from "react";
import type {
  AnyPathAtlas,
  BoundPathComposer,
  NextClientPlugDefiner,
  NextClientPlugKitMap,
} from "#r-machine/next/core";
import { lookupScope } from "./scope-registry.js";

export type NextAppClientToolset<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  EF extends ExperimentalFlags,
  CKM extends NextClientPlugKitMap<RA>,
  PA extends AnyPathAtlas,
> = {
  readonly NextClientRMachine: NextAppClientRMachine<L>;
  readonly ClientPlug: NextClientPlugDefiner<RA, L, CKM, PA>;
} & (EF["outerGear"] extends "on"
  ? {
      readonly VertexFrame: VertexFrameType;
    }
  : {});

export type NextAppClientRMachine<L extends AnyLocale> = (props: NextAppClientRMachineProps<L>) => ReactNode;
interface NextAppClientRMachineProps<L extends AnyLocale> {
  readonly locale: L;
  readonly children: ReactNode;
  // Opaque per-request id set by NextServerRMachine. NextClientRMachine
  // resolves it (server-side via the globalThis registry, browser-side
  // unavailable so resolves to null) and exposes the resulting RequestScope
  // through RequestScopeContext for `useBareReactPlug` to consume.
  readonly scopeId?: string;
}

export interface NextAppClientImpl<L extends AnyLocale> {
  // biome-ignore lint/suspicious/noConfusingVoidType: As per design
  readonly onLoad: ((locale: L) => void | (() => void)) | undefined;
  readonly writeLocale: (
    locale: L,
    newLocale: L,
    pathname: ReturnType<typeof usePathname>,
    router: ReturnType<typeof useRouter>
  ) => void | Promise<void>;
  createPathComposer: (locale: L) => BoundPathComposer<AnyPathAtlas>;
}

export async function createNextAppClientToolset<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends AnyResEquipment<RA>,
  EF extends ExperimentalFlags,
  CKM extends NextClientPlugKitMap<RA>,
  PA extends AnyPathAtlas,
>(
  rMachine: RMachine<RA, L, E, EF>,
  clientKit: CKM,
  impl: NextAppClientImpl<L>,
  options: CreateReactBareToolsetOptions = {}
): Promise<NextAppClientToolset<RA, L, EF, CKM, PA>> {
  const {
    ReactRMachine,
    VertexFrame,
    Plug: BasePlug,
  } = await createReactBareToolset(rMachine as RMachine<RA, L, E, { outerGear: "on" }>, clientKit, options);

  function NextClientRMachine({ locale, scopeId, children }: NextAppClientRMachineProps<L>) {
    useEffect(() => {
      if (impl.onLoad !== undefined) {
        return impl.onLoad(locale);
      }
    }, [locale]);

    // Resolve the per-request scope from the global registry. On the server
    // (SSR pass for this client component), the registry was populated by
    // NextServerRMachine; on the browser, `globalThis` is a different
    // instance with an empty registry, so this falls through to null and
    // the RM uses its process-tier slots map.
    const scope = typeof scopeId === "string" ? lookupScope(scopeId) : null;

    return (
      <RequestScopeContext.Provider value={scope}>
        <ReactRMachine locale={locale}>{children}</ReactRMachine>
      </RequestScopeContext.Provider>
    );
  }

  const ClientPlug = ((...args: unknown[]) => {
    const body = (BasePlug as unknown as (...a: unknown[]) => { useR: () => unknown })(...args);
    const baseUseR = body.useR;

    function useNextClientPlug() {
      const baseResult = baseUseR();
      const router = useRouter();
      const pathname = usePathname();

      const pathnameRef = useRef<string | undefined>(undefined);
      const localeRef = useRef<L | undefined>(undefined);

      // Same $ is reused across renders for the same wire;
      // setting these methods conditionally — only on change
      // of locale/pathname — is safe and avoids unnecessary closures.
      const $ = Array.isArray(baseResult)
        ? (baseResult[baseResult.length - 1] as Record<string, unknown>)
        : (baseResult as { $: Record<string, unknown> }).$;
      const locale = $.locale as L;

      const localeChanged = locale !== localeRef.current;
      if (localeChanged) {
        localeRef.current = locale;
        $.getPath = impl.createPathComposer(locale);
      }

      if (pathname !== pathnameRef.current || localeChanged) {
        pathnameRef.current = pathname;

        $.setLocale = async (newLocale: L): Promise<void> => {
          // Do not check if the locale is different.
          // The origin strategy allows same locale on multiple origins, so navigation might still be necessary.
          const error = rMachine.localeHelper.validateLocale(newLocale);
          if (error) {
            throw new RMachineUsageError(ERR_UNKNOWN_LOCALE, `Cannot set invalid locale: "${newLocale}".`, error);
          }
          const result = impl.writeLocale(locale, newLocale, pathname, router);
          if (result instanceof Promise) {
            await result;
          }
        };
      }

      return baseResult;
    }
    body.useR = useNextClientPlug;

    return body;
  }) as NextClientPlugDefiner<RA, L, CKM, PA>;

  return {
    NextClientRMachine,
    VertexFrame,
    ClientPlug,
  };
}
