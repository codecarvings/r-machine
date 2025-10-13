"use client";

import type { AnyAtlas, RMachine } from "r-machine";
import { type ReactRMachine, ReactTools, type ReactToolsInterface } from "react-r-machine";
import type { NextAppRouterStrategy } from "./next-app-router-strategy";

export interface NextAppRouterClientRMachine<A extends AnyAtlas, LK extends string> extends ReactRMachine {
  readonly rMachine: RMachine<A>;
  readonly strategy: NextAppRouterStrategy<LK>;
}

type NextAppRouterClientTools<A extends AnyAtlas, LK extends string> = Omit<ReactToolsInterface<A>, "ReactRMachine"> & {
  readonly NextClientRMachine: NextAppRouterClientRMachine<A, LK>;
};

export function createNextAppRouterClientTools<A extends AnyAtlas, LK extends string>(
  rMachine: RMachine<A>,
  strategy: NextAppRouterStrategy<LK>
): NextAppRouterClientTools<A, LK> {
  const { ReactRMachine, ...otherTools } = ReactTools.create(rMachine, strategy);
  const NextClientRMachine = ReactRMachine as any;
  NextClientRMachine.rMachine = rMachine;
  NextClientRMachine.strategy = strategy;

  return {
    NextClientRMachine,
    ...otherTools,
  };
}
