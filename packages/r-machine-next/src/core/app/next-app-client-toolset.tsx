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
import { createReactBareToolset } from "@r-machine/react/core";
import { usePathname, useRouter } from "next/navigation";
import type { RMachine } from "r-machine";
import type { AnyResAtlas, ExperimentalFlags, ResEquipment } from "r-machine/core";
import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "r-machine/errors";
import type { AnyLocale } from "r-machine/locale";
import { type ReactNode, useEffect } from "react";
import type {
  AnyPathAtlas,
  BoundPathComposer,
  NextClientPlugDefiner,
  NextClientPlugKitMap,
} from "#r-machine/next/core";

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
  E extends ResEquipment<RA>,
  EF extends ExperimentalFlags,
  CKM extends NextClientPlugKitMap<RA>,
  PA extends AnyPathAtlas,
>(
  rMachine: RMachine<RA, L, E, EF>,
  clientKit: CKM,
  impl: NextAppClientImpl<L>
): Promise<NextAppClientToolset<RA, L, EF, CKM, PA>> {
  const {
    ReactRMachine,
    VertexFrame,
    Plug: BasePlug,
  } = await createReactBareToolset(rMachine as RMachine<RA, L, E, { outerGear: "on" }>, clientKit);

  function NextClientRMachine({ locale, children }: NextAppClientRMachineProps<L>) {
    useEffect(() => {
      if (impl.onLoad !== undefined) {
        return impl.onLoad(locale);
      }
    }, [locale]);
    return <ReactRMachine locale={locale}>{children}</ReactRMachine>;
  }

  const ClientPlug = ((...args: unknown[]) => {
    const body = (BasePlug as unknown as (...a: unknown[]) => { useR: () => unknown })(...args);
    const baseUseR = body.useR;

    function useNextClientPlug() {
      const baseResult = baseUseR();
      const router = useRouter();
      const pathname = usePathname();

      // The plugin's `$` is recreated on every reresolve (juncture-manager
      // builds a fresh `$ = { kit }` then runs augmentCtx). Mutating it here
      // is safe — there is no caching across reresolves to disturb. Reading
      // `$.locale` keeps us coherent with the resolved plugin instead of the
      // raw React context.
      const $ = Array.isArray(baseResult)
        ? (baseResult[baseResult.length - 1] as Record<string, unknown>)
        : (baseResult as { $: Record<string, unknown> }).$;
      const locale = $.locale as L;

      $.getPath = impl.createPathComposer(locale);
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
