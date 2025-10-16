"use client";

import { useRouter } from "next/navigation";
import type { AnyAtlas, RMachine } from "r-machine";
import type { ReactNode } from "react";
import type { ReactRMachine } from "react-r-machine";
import { createReactTools, type ReactToolsInterface } from "react-r-machine/lib";
import type { NextAppRouterStrategy } from "./next-app-router-strategy";

const brand: unique symbol = Symbol.for("NextAppRouterClientRMachine");

interface NextAppRouterClientRMachineProps {
  readonly locale: string;
  readonly children: ReactNode;
}
export interface NextAppRouterClientRMachine extends ReactRMachine {
  (props: NextAppRouterClientRMachineProps): JSX.Element;
  readonly [brand]: true;
}

type NextAppRouterClientTools<A extends AnyAtlas> = Omit<ReactToolsInterface<A>, "ReactRMachine"> & {
  readonly NextClientRMachine: NextAppRouterClientRMachine;
};

export function createNextAppRouterClientTools<A extends AnyAtlas>(
  rMachine: RMachine<A>,
  strategy: NextAppRouterStrategy<any, string>
): NextAppRouterClientTools<A> {
  const { ReactRMachine, ...otherTools } = createReactTools(rMachine, strategy, {
    writeLocale: () => {
      const router = useRouter();
      return { router };
    },
  });
  // const NextClientRMachine = ReactRMachine as any;

  function NextClientRMachine({ locale, children }: NextAppRouterClientRMachineProps) {
    return <ReactRMachine locale={locale}>{children}</ReactRMachine>;
  }
  NextClientRMachine[brand] = true;

  return {
    NextClientRMachine: NextClientRMachine as NextAppRouterClientRMachine,
    ...otherTools,
  };
}
