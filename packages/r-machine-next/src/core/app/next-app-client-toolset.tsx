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
import { type ReactNode, useEffect } from "react";
import type { AnyPathAtlas, BoundPathComposer } from "#r-machine/next/core";

export type NextAppClientToolset<RA extends AnyResourceAtlas, PA extends AnyPathAtlas> = Omit<
  ReactBareToolset<RA>,
  "ReactRMachine"
> & {
  readonly NextClientRMachine: NextAppClientRMachine;
  readonly usePathComposer: () => BoundPathComposer<PA>;
};

export type NextAppClientRMachine = (props: NextAppClientRMachineProps) => ReactNode;
interface NextAppClientRMachineProps {
  readonly locale: string;
  readonly children: ReactNode;
}

export interface NextAppClientImpl {
  // biome-ignore lint/suspicious/noConfusingVoidType: As per design
  readonly onLoad: ((locale: string) => void | (() => void)) | undefined;
  readonly writeLocale: (
    locale: string,
    newLocale: string,
    pathname: ReturnType<typeof usePathname>,
    router: ReturnType<typeof useRouter>
  ) => void | Promise<void>;
  createUsePathComposer: (useLocale: () => string) => () => BoundPathComposer<AnyPathAtlas>;
}

export async function createNextAppClientToolset<RA extends AnyResourceAtlas, PA extends AnyPathAtlas>(
  rMachine: RMachine<RA>,
  impl: NextAppClientImpl
): Promise<NextAppClientToolset<RA, PA>> {
  const { ReactRMachine, useLocale, ...otherTools } = await createReactBareToolset(rMachine);

  async function setLocale(
    locale: string,
    newLocale: string,
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

  function useSetLocale(): ReturnType<ReactBareToolset<RA>["useSetLocale"]> {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    return (newLocale: string) => setLocale(locale, newLocale, pathname, router);
  }

  function NextClientRMachine({ locale, children }: NextAppClientRMachineProps) {
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
