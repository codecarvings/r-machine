"use client";

import { createReactToolset, type ReactToolset } from "@r-machine/react/core";
import { useRouter } from "next/navigation";
import type { AnyAtlas, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { type ReactNode, useEffect } from "react";

const brand = Symbol("NextClientRMachine");

interface NextClientRMachineProps {
  readonly locale: string;
  readonly children: ReactNode;
}
export interface NextClientRMachine {
  (props: NextClientRMachineProps): ReactNode;
  readonly [brand]: "NextClientRMachine";
}

export type NextClientToolset<A extends AnyAtlas> = Omit<ReactToolset<A>, "ReactRMachine"> & {
  readonly NextClientRMachine: NextClientRMachine;
};

export type NextClientImpl = {
  readonly writeLocale: (newLocale: string, router: ReturnType<typeof useRouter>) => void | Promise<void>;
  // biome-ignore lint/suspicious/noConfusingVoidType: As per design
  readonly onLoad: ((locale: string) => void | (() => void)) | undefined;
};

export function createNextClientToolset<A extends AnyAtlas>(
  rMachine: RMachine<A>,
  impl: NextClientImpl
): NextClientToolset<A> {
  const { ReactRMachine, useLocale, ...otherTools } = createReactToolset(rMachine);

  async function setLocale(locale: string, newLocale: string, router: ReturnType<typeof useRouter>): Promise<void> {
    if (newLocale === locale) {
      return;
    }

    const error = rMachine.localeHelper.validateLocale(newLocale);
    if (error) {
      throw new RMachineError(`Cannot set invalid locale: ${newLocale}.`, error);
    }

    const writeLocaleResult = impl.writeLocale(newLocale, router);
    if (writeLocaleResult instanceof Promise) {
      await writeLocaleResult;
    }
  }

  function useSetLocale(): ReturnType<ReactToolset<A>["useSetLocale"]> {
    const locale = useLocale();
    const router = useRouter();

    return (newLocale: string) => setLocale(locale, newLocale, router);
  }

  function NextClientRMachine({ locale, children }: NextClientRMachineProps) {
    useEffect(() => {
      if (impl.onLoad !== undefined) {
        return impl.onLoad(locale);
      }
    }, [locale, impl.onLoad]);
    return <ReactRMachine locale={locale}>{children}</ReactRMachine>;
  }
  NextClientRMachine[brand] = "NextClientRMachine";

  return {
    ...otherTools,
    NextClientRMachine: NextClientRMachine as NextClientRMachine,
    useLocale,
    useSetLocale,
  };
}
