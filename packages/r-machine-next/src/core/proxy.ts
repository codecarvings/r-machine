import type { NextRequest } from "next/dist/server/web/spec-extension/request.js";
import type { NextFetchEvent } from "next/server";
import type { NextProxy, NextProxyResult } from "#r-machine/next/internal";

type ProxyChainFn = (previousProxy: NextProxy) => Promise<NextProxy>;
export interface RMachineProxy extends NextProxy {
  readonly chain: ProxyChainFn;
}

type ChainableProxy = (
  request: NextRequest,
  event: NextFetchEvent,
  previousResult: NextProxyResult
) => NextProxyResult | Promise<NextProxyResult>;

export function createProxyChainFunction(secondProxy: ChainableProxy): ProxyChainFn {
  return async (firstProxy: NextProxy) => {
    function chainedProxy(request: NextRequest, event: NextFetchEvent): NextProxyResult | Promise<NextProxyResult> {
      const result = firstProxy(request, event);
      if (result instanceof Promise) {
        return result.then((resolvedResult) => secondProxy(request, event, resolvedResult));
      } else {
        return secondProxy(request, event, result);
      }
    }

    return chainedProxy;
  };
}
