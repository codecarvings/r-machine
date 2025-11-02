import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";
import type { AnyAtlas, AtlasNamespace, AtlasNamespaceList, RKit, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { cache, type JSX, type ReactNode } from "react";
import type { NextClientRMachine } from "#r-machine/next/core";
import type { NextProxyServerImplPackage } from "./next-proxy-server-impl.js";

const localeHeaderName = "x-rm-locale";

export interface RMachineProxy extends NextMiddleware {
  readonly chain: (followingProxy: RMachineProxy) => NextMiddleware;
}

export interface NextProxyServerToolset<A extends AnyAtlas> {
  readonly rMachineProxy: RMachineProxy;
  readonly NextServerRMachine: NextProxyServerRMachine;
  readonly getLocale: () => string;
  readonly setLocale: (newLocale: string) => void;
  readonly pickR: <N extends AtlasNamespace<A>>(namespace: N) => Promise<A[N]>;
  readonly pickRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => Promise<RKit<A, NL>>;
}

interface NextProxyServerRMachineProps {
  readonly children: ReactNode;
}
export type NextProxyServerRMachine = (props: NextProxyServerRMachineProps) => JSX.Element;

interface NextProxyServerRMachineContext {
  value: string | null;
}

export function createNextProxyServerToolset<A extends AnyAtlas, C>(
  rMachine: RMachine<A>,
  strategyConfig: C,
  implPackage: NextProxyServerImplPackage<C>,
  NextClientRMachine: NextClientRMachine
): NextProxyServerToolset<A> {
  const validateLocale = rMachine.localeHelper.validateLocale;
  const partialBin = { strategyConfig, rMachine };

  const getContext = cache((): NextProxyServerRMachineContext => {
    return {
      value: null,
    };
  });

  function rMachineProxy(request: NextRequest): ReturnType<NextMiddleware> {
    // const bin = implPackage.binFactories.readLocale({ strategyConfig, rMachine, request });
    //const locale = implPackage.impl.readLocale(bin);
    request.headers.set(localeHeaderName, "en");
  }

  rMachineProxy.chain = (followingProxy: RMachineProxy): NextMiddleware => {
    return (request: NextRequest, event: NextFetchEvent) => {
      rMachineProxy(request);
      return followingProxy(request, event);
    };
  };

  function NextServerRMachine({ children }: NextProxyServerRMachineProps) {
    return <NextClientRMachine locale={getLocale()}>{children}</NextClientRMachine>;
  }

  function getLocale(): string {
    const context = getContext();
    if (context.value === null) {
      throw new RMachineError(
        "NextProxyServerRMachineContext not initialized. bindLocale not invoked? (you must invoke bindLocale at the beginning of every page or layout component)."
      );
    }
    return context.value;
  }

  function setLocale(newLocale: string) {
    const error = validateLocale(newLocale);
    if (error) {
      throw new RMachineError(`Cannot set locale to invalid locale: "${newLocale}".`, error);
    }

    const bin = implPackage.binFactories.writeLocale(partialBin);
    implPackage.impl.writeLocale(newLocale, bin);
  }

  async function pickR<N extends AtlasNamespace<A>>(namespace: N): Promise<A[N]> {
    return rMachine.pickR(getLocale(), namespace) as Promise<A[N]>;
  }

  async function pickRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): Promise<RKit<A, NL>> {
    return rMachine.pickRKit(getLocale(), ...namespaces) as Promise<RKit<A, NL>>;
  }

  return {
    rMachineProxy,
    NextServerRMachine,
    getLocale,
    setLocale,
    pickR,
    pickRKit,
  };
}
