"use client";

import { createReactBareToolset, type ReactBareToolset } from "@r-machine/react/core";
import { useRouter } from "next/navigation";
import type { AnyAtlas, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { type ReactNode, useEffect } from "react";
import type { BoundPathComposer } from "./path.js";
import type { AnyPathAtlas } from "./path-atlas.js";

interface NextClientRMachineProps {
  readonly locale: string;
  readonly children: ReactNode;
}
export type NextClientRMachine = (props: NextClientRMachineProps) => ReactNode;

export type NextClientToolset<A extends AnyAtlas, PA extends AnyPathAtlas> = Omit<
  ReactBareToolset<A>,
  "ReactRMachine"
> & {
  readonly usePathComposer: () => BoundPathComposer<PA>;
};
export interface NextClientToolsetEnvelope<A extends AnyAtlas, PA extends AnyPathAtlas> {
  readonly NextClientRMachine: NextClientRMachine;
  readonly toolset: NextClientToolset<A, PA>;
}

export interface NextClientImpl {
  // biome-ignore lint/suspicious/noConfusingVoidType: As per design
  readonly onLoad: ((locale: string) => void | (() => void)) | undefined;
  readonly writeLocale: (newLocale: string, router: ReturnType<typeof useRouter>) => void | Promise<void>;
  createUsePathComposer: (useLocale: () => string) => () => BoundPathComposer<AnyPathAtlas>;
}

export async function createNextClientToolsetEnvelope<A extends AnyAtlas, PA extends AnyPathAtlas>(
  rMachine: RMachine<A>,
  impl: NextClientImpl
): Promise<NextClientToolsetEnvelope<A, PA>> {
  const { ReactRMachine, useLocale, ...otherTools } = await createReactBareToolset(rMachine);

  async function setLocale(newLocale: string, router: ReturnType<typeof useRouter>): Promise<void> {
    // Do not check if the locale is different
    // The origin strategy allows same locale on multiple origins, so the navigation might still be necessary

    const error = rMachine.localeHelper.validateLocale(newLocale);
    if (error) {
      throw new RMachineError(`Cannot set invalid locale: ${newLocale}.`, error);
    }

    const writeLocaleResult = impl.writeLocale(newLocale, router);
    if (writeLocaleResult instanceof Promise) {
      await writeLocaleResult;
    }
  }

  function useSetLocale(): ReturnType<ReactBareToolset<A>["useSetLocale"]> {
    const router = useRouter();

    return (newLocale: string) => setLocale(newLocale, router);
  }

  function NextClientRMachine({ locale, children }: NextClientRMachineProps) {
    useEffect(() => {
      if (impl.onLoad !== undefined) {
        return impl.onLoad(locale);
      }
    }, [locale, impl.onLoad]);
    return <ReactRMachine locale={locale}>{children}</ReactRMachine>;
  }

  const usePathComposer = impl.createUsePathComposer(useLocale);

  const toolset: NextClientToolset<A, PA> = {
    ...otherTools,
    useLocale,
    useSetLocale,
    usePathComposer,
  };
  return { NextClientRMachine, toolset };
}
