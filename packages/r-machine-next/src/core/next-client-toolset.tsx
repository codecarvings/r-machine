"use client";

import { createReactBareToolset, type ReactBareToolset } from "@r-machine/react/core";
import { useRouter } from "next/navigation";
import type { AnyAtlas, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { type ReactNode, useEffect } from "react";

interface NextClientRMachineProps {
  readonly locale: string;
  readonly children: ReactNode;
}
export type NextClientRMachine = (props: NextClientRMachineProps) => ReactNode;

export type NextClientToolset<A extends AnyAtlas> = Omit<ReactBareToolset<A>, "ReactRMachine">;
export interface NextClientToolsetEnvelope<A extends AnyAtlas> {
  readonly NextClientRMachine: NextClientRMachine;
  readonly toolset: NextClientToolset<A>;
}

export interface NextClientImpl {
  // biome-ignore lint/suspicious/noConfusingVoidType: As per design
  readonly onLoad: ((locale: string) => void | (() => void)) | undefined;
  readonly writeLocale: (newLocale: string, router: ReturnType<typeof useRouter>) => void | Promise<void>;
}

export async function createNextClientToolsetEnvelope<A extends AnyAtlas>(
  rMachine: RMachine<A>,
  impl: NextClientImpl
): Promise<NextClientToolsetEnvelope<A>> {
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

  const toolset: NextClientToolset<A> = {
    ...otherTools,
    useLocale,
    useSetLocale,
  };
  return { NextClientRMachine, toolset };
}
