"use client";

import { createReactToolset, type ReactToolset } from "@r-machine/react/core";
import type { AnyAtlas, RMachine } from "r-machine";
import type { RMachineError } from "r-machine/errors";
import type { JSX, ReactNode } from "react";
import type { NextClientImplPackage } from "./next-client-impl.js";

const brand = Symbol("NextAppRouterClientRMachine");

interface NextClientRMachineProps {
  readonly locale: string;
  readonly children: ReactNode;
}
export interface NextClientRMachine {
  (props: NextClientRMachineProps): JSX.Element;
  readonly [brand]: true;
}

export type NextClientToolset<A extends AnyAtlas> = Omit<ReactToolset<A>, "ReactRMachine"> & {
  readonly NextClientRMachine: NextClientRMachine;
};

function setLocale(
  locale: string,
  newLocale: string,
  writeLocaleBin: unknown,
  validateLocale: (locale: string) => RMachineError | null,
  writeLocale: (newLocale: string, bin: any) => void
) {
  if (newLocale === locale) {
    return;
  }

  const error = validateLocale(newLocale);
  if (error) {
    throw error;
  }

  writeLocale(newLocale, writeLocaleBin);
}

export function createNextClientToolset<A extends AnyAtlas, C>(
  rMachine: RMachine<A>,
  strategyConfig: C,
  implPackage: NextClientImplPackage<C>
): NextClientToolset<A> {
  const { ReactRMachine, useLocale, ...otherTools } = createReactToolset(rMachine);
  const validateLocale = rMachine.localeHelper.validateLocale;
  const writeLocale = implPackage.impl.writeLocale;

  function useSetLocale(): ReturnType<ReactToolset<A>["useSetLocale"]> {
    const locale = useLocale();
    const bin = implPackage.binFactories.writeLocale({ strategyConfig, rMachine });

    return (newLocale: string) => {
      setLocale(locale, newLocale, bin, validateLocale, writeLocale);
    };
  }

  function NextClientRMachine({ locale, children }: NextClientRMachineProps) {
    return <ReactRMachine locale={locale}>{children}</ReactRMachine>;
  }
  NextClientRMachine[brand] = true;

  return {
    ...otherTools,
    NextClientRMachine: NextClientRMachine as NextClientRMachine,
    useLocale,
    useSetLocale,
  };
}
