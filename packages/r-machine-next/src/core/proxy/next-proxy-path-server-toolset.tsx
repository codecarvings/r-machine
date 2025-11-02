import type { AnyAtlas, RMachine } from "r-machine";
import type { NextClientRMachine } from "#r-machine/next/core";
import type { NextProxyServerImplPackage } from "./next-proxy-server-impl.js";
import { createNextProxyServerToolset, type NextProxyServerToolset } from "./next-proxy-server-toolset.js";

export interface NextProxyPathServerToolset<A extends AnyAtlas, LK extends string> extends NextProxyServerToolset<A> {
  readonly generateLocaleStaticParams: LocaleStaticParamsGenerator<LK>;
}

type RMachineParams<LK extends string> = {
  [P in LK]: string;
};

type LocaleStaticParamsGenerator<LK extends string> = () => Promise<RMachineParams<LK>[]>;

export function createNextProxyPathServerToolset<A extends AnyAtlas, C, LK extends string>(
  rMachine: RMachine<A>,
  strategyConfig: C,
  localeKey: LK,
  implPackage: NextProxyServerImplPackage<C>,
  NextClientRMachine: NextClientRMachine
): NextProxyPathServerToolset<A, LK> {
  const tools = createNextProxyServerToolset(rMachine, strategyConfig, implPackage, NextClientRMachine);

  async function generateLocaleStaticParams() {
    return rMachine.config.locales.map((locale) => ({
      [localeKey]: locale,
    }));
  }

  return {
    ...tools,
    generateLocaleStaticParams: generateLocaleStaticParams as LocaleStaticParamsGenerator<LK>,
  };
}
