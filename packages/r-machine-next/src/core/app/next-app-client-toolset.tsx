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

import { createReactBareToolset, type ReactBareToolset } from "@r-machine/react/core";
import { usePathname, useRouter } from "next/navigation";
import type { AnyResourceAtlas, RMachine } from "r-machine";
import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "r-machine/errors";
import type { AnyLocale } from "r-machine/locale";
import { type ReactNode, useEffect } from "react";
import type { AnyPathAtlas, BoundPathComposer } from "#r-machine/next/core";

export type NextAppClientToolset<RA extends AnyResourceAtlas, L extends AnyLocale, PA extends AnyPathAtlas> = Omit<
  ReactBareToolset<RA, L>,
  "ReactRMachine"
> & {
  readonly NextClientRMachine: NextAppClientRMachine<L>;
  readonly usePathComposer: () => BoundPathComposer<PA>;
};

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
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  PA extends AnyPathAtlas,
>(rMachine: RMachine<RA, L>, impl: NextAppClientImpl<L>): Promise<NextAppClientToolset<RA, L, PA>> {
  const { ReactRMachine, useLocale, ...otherTools } = await createReactBareToolset(rMachine);

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

  function useSetLocale(): ReturnType<ReactBareToolset<RA, L>["useSetLocale"]> {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    return (newLocale: L) => setLocale(locale, newLocale, pathname, router);
  }

  function NextClientRMachine({ locale, children }: NextAppClientRMachineProps<L>) {
    useEffect(() => {
      if (impl.onLoad !== undefined) {
        return impl.onLoad(locale);
      }
    }, [locale]);
    return <ReactRMachine locale={locale}>{children}</ReactRMachine>;
  }

  const usePathComposer = impl.createUsePathComposer(useLocale);

  return {
    ...otherTools,
    useLocale,
    useSetLocale,
    usePathComposer,
    NextClientRMachine,
  };
}
