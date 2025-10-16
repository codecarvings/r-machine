"use client";

import { useRouter } from "next/navigation";
import type { AnyAtlas, RMachine } from "r-machine";
import type { ReactNode } from "react";
import { type ReactRMachine, ReactTools, type ReactToolsInterface } from "react-r-machine";
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
  const { ReactRMachine, ...otherTools } = ReactTools.create(rMachine, strategy);
  // const NextClientRMachine = ReactRMachine as any;

  function NextClientRMachine({ locale, children }: NextAppRouterClientRMachineProps) {
    // Workaround to make the Next.js router available in the client implementation
    const router = useRouter();
    (global as any).__R_MACHINE_NEXT_ROUTER = router;

    return <ReactRMachine locale={locale}>{children}</ReactRMachine>;
  }
  NextClientRMachine[brand] = true;

  return {
    NextClientRMachine: NextClientRMachine as NextAppRouterClientRMachine,
    ...otherTools,
  };
}
