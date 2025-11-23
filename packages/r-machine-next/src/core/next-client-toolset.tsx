"use client";

import { createReactToolset, type ReactToolset } from "@r-machine/react/core";
import type { SuspenseComponent } from "@r-machine/react/utils";
import { useRouter } from "next/navigation";
import type { AnyAtlas, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { type ReactNode, useEffect } from "react";

const brand = Symbol("NextClientRMachine");

interface NextClientRMachineProps {
  readonly locale: string;
  readonly fallback?: ReactNode;
  readonly Suspense?: SuspenseComponent | null | undefined; // Null means no suspense
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
  // biome-ignore lint/suspicious/noConfusingVoidType: As per design
  readonly onLoad: ((locale: string) => void | (() => void)) | undefined;
  readonly writeLocale: (newLocale: string, router: ReturnType<typeof useRouter>) => void | Promise<void>;
};

export function createNextClientToolset<A extends AnyAtlas>(
  rMachine: RMachine<A>,
  impl: NextClientImpl
): NextClientToolset<A> {
  const { ReactRMachine, useLocale, ...otherTools } = createReactToolset(rMachine);

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

  function useSetLocale(): ReturnType<ReactToolset<A>["useSetLocale"]> {
    const router = useRouter();

    return (newLocale: string) => setLocale(newLocale, router);
  }

  function NextClientRMachine({ locale, fallback, Suspense, children }: NextClientRMachineProps) {
    useEffect(() => {
      if (impl.onLoad !== undefined) {
        return impl.onLoad(locale);
      }
    }, [locale, impl.onLoad]);
    return (
      <ReactRMachine locale={locale} fallback={fallback} Suspense={Suspense}>
        {children}
      </ReactRMachine>
    );
  }
  NextClientRMachine[brand] = "NextClientRMachine";

  return {
    ...otherTools,
    NextClientRMachine: NextClientRMachine as NextClientRMachine,
    useLocale,
    useSetLocale,
  };
}
