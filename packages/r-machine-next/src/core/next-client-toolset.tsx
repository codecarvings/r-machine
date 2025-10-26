"use client";

import { createReactToolset, type ReactToolset } from "@r-machine/react/core";
import type { AnyAtlas, RMachine } from "r-machine";
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

export type NextClientToolset<A extends AnyAtlas> = Omit<ReactToolset<A, unknown>, "ReactRMachine"> & {
  readonly NextClientRMachine: NextClientRMachine;
};

export function createNextClientToolset<A extends AnyAtlas, C>(
  rMachine: RMachine<A>,
  strategyConfig: C,
  implPackage: NextClientImplPackage<C>
): NextClientToolset<A> {
  const { ReactRMachine, ...otherTools } = createReactToolset(rMachine, strategyConfig, implPackage.binProviders);

  function NextClientRMachine({ locale, children }: NextClientRMachineProps) {
    return (
      <ReactRMachine locale={locale} writeLocale={implPackage.impl.writeLocale as any}>
        {children}
      </ReactRMachine>
    );
  }
  NextClientRMachine[brand] = true;

  return {
    NextClientRMachine: NextClientRMachine as NextClientRMachine,
    ...otherTools,
  };
}
