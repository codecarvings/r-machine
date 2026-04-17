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

import { createReactBareToolset } from "@r-machine/react/core";
import type { usePathname, useRouter } from "next/navigation";
import type { RMachine } from "r-machine";
import type { AnyResAtlas, ResKit } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import { type ReactNode, useEffect } from "react";
import type { AnyPathAtlas, BoundPathComposer } from "#r-machine/next/core";
import type { NextClientPlugComposer } from "../next-client-plug.js";

export interface NextAppClientToolset<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends ResKit<RA>,
  PA extends AnyPathAtlas,
> {
  readonly NextClientRMachine: NextAppClientRMachine<L>;
  readonly ClientPlug: NextClientPlugComposer<RA, L, KA["gate"], PA>;
}

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
  createUsePathComposer: (useLocale: () => L) => () => BoundPathComposer<AnyPathAtlas>;
}

export async function createNextAppClientToolset<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends ResKit<RA>,
  PA extends AnyPathAtlas,
>(rMachine: RMachine<RA, L, KA>, impl: NextAppClientImpl<L>): Promise<NextAppClientToolset<RA, L, KA, PA>> {
  const { ReactRMachine } = await createReactBareToolset(rMachine);

  // TODO: WP
  const ClientPlug: any = undefined!;

  /*
  async function setLocale(
    locale: L,
    newLocale: L,
    pathname: ReturnType<typeof usePathname>,
    router: ReturnType<typeof useRouter>
  ): Promise<void> {
    // Do not check if the locale is different
    // The origin strategy allows same locale on multiple origins, so the navigation might still be necessary

    const error = rMachine.localeHelper.validateLocale(newLocale);
    if (error) {
      throw new RMachineUsageError(ERR_UNKNOWN_LOCALE, `Cannot set invalid locale: ${newLocale}.`, error);
    }

    const writeLocaleResult = impl.writeLocale(locale, newLocale, pathname, router);
    if (writeLocaleResult instanceof Promise) {
      await writeLocaleResult;
    }
  }


  function useSetLocale(): ReturnType<ReactBareToolset<RA, L, KA>["useSetLocale"]> {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    return (newLocale: L) => setLocale(locale, newLocale, pathname, router);
  }

  const usePathComposer = impl.createUsePathComposer(useLocale);
  */

  function NextClientRMachine({ locale, children }: NextAppClientRMachineProps<L>) {
    useEffect(() => {
      if (impl.onLoad !== undefined) {
        return impl.onLoad(locale);
      }
    }, [locale]);
    return <ReactRMachine locale={locale}>{children}</ReactRMachine>;
  }

  return {
    NextClientRMachine,
    ClientPlug,
  };
}
