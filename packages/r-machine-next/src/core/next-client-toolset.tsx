"use client";

import { createReactToolset, type ReactToolset } from "@r-machine/react/core";
import { useRouter } from "next/navigation";
import type { AnyAtlas, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import type { JSX, ReactNode } from "react";

const brand = Symbol("NextAppRouterClientRMachine");

interface NextClientRMachineProps {
  readonly locale: string;
  readonly children: ReactNode;
}
export interface NextClientRMachine {
  (props: NextClientRMachineProps): JSX.Element;
  readonly [brand]: "NextAppRouterClientRMachine";
}

export type NextClientToolset<A extends AnyAtlas> = Omit<ReactToolset<A>, "ReactRMachine"> & {
  readonly NextClientRMachine: NextClientRMachine;
};

export type NextClientImpl = {
  readonly writeLocale: (newLocale: string, router: ReturnType<typeof useRouter>) => void;
};

export function createNextClientToolset<A extends AnyAtlas>(
  rMachine: RMachine<A>,
  impl: NextClientImpl
): NextClientToolset<A> {
  const { ReactRMachine, useLocale, ...otherTools } = createReactToolset(rMachine);

  function setLocale(locale: string, newLocale: string, router: ReturnType<typeof useRouter>): void {
    if (newLocale === locale) {
      return;
    }

    const error = rMachine.localeHelper.validateLocale(newLocale);
    if (error) {
      throw new RMachineError(`Cannot set invalid locale: ${newLocale}.`, error);
    }

    impl.writeLocale(newLocale, router);
  }

  function useSetLocale(): ReturnType<ReactToolset<A>["useSetLocale"]> {
    const locale = useLocale();
    const router = useRouter();

    return (newLocale: string) => {
      setLocale(locale, newLocale, router);
    };
  }

  function NextClientRMachine({ locale, children }: NextClientRMachineProps) {
    return <ReactRMachine locale={locale}>{children}</ReactRMachine>;
  }
  NextClientRMachine[brand] = "NextAppRouterClientRMachine";

  return {
    ...otherTools,
    NextClientRMachine: NextClientRMachine as NextClientRMachine,
    useLocale,
    useSetLocale,
  };
}
