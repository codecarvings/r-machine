"use client";

import type { AnyAtlas, RMachine } from "r-machine";
import { type ReactRMachine, ReactTools, type ReactToolsInterface } from "react-r-machine";
import type { NextAppRouterStrategy } from "./next-app-router-strategy";

const brand: unique symbol = Symbol.for("NextAppRouterClientRMachine");
export interface NextAppRouterClientRMachine extends ReactRMachine {
  readonly [brand]: true;
}

type NextAppRouterClientTools<A extends AnyAtlas> = Omit<ReactToolsInterface<A>, "ReactRMachine"> & {
  readonly NextClientRMachine: NextAppRouterClientRMachine;
};

export function createNextAppRouterClientTools<A extends AnyAtlas, LK extends string>(
  rMachine: RMachine<A>,
  strategy: NextAppRouterStrategy<LK>
): NextAppRouterClientTools<A> {
  const { ReactRMachine, ...otherTools } = ReactTools.create(rMachine, strategy);
  const NextClientRMachine = ReactRMachine as any;
  NextClientRMachine[brand] = true;

  return {
    NextClientRMachine,
    ...otherTools,
  };
}
