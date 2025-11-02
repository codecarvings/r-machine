import type { AnyAtlas, RMachine } from "r-machine";
import { type NextClientImpl, NextClientImplProvider, type NextClientRMachine } from "#r-machine/next/core";
import { createNextProxyServerImplPackage, type NextProxyServerImpl } from "./next-proxy-server-impl.js";
import { createNextProxyServerToolset } from "./next-proxy-server-toolset.js";

export class NextProxyImplProvider<C> extends NextClientImplProvider<C> {
  protected constructor(
    config: C,
    clientImpl: NextClientImpl<C>,
    protected readonly serverImpl: NextProxyServerImpl<C>
  ) {
    super(config, clientImpl);
  }

  protected createServerToolset<A extends AnyAtlas>(rMachine: RMachine<A>, NextClientRMachine: NextClientRMachine) {
    return createNextProxyServerToolset(
      rMachine,
      this.config,
      createNextProxyServerImplPackage(this.serverImpl),
      NextClientRMachine
    );
  }

  static define(
    clientImpl: NextClientImpl<undefined>,
    serverImpl: NextProxyServerImpl<undefined>
  ): NextProxyImplProvider<undefined>;
  static define<C>(
    clientImpl: NextClientImpl<C>,
    serverImpl: NextProxyServerImpl<C>,
    config: C
  ): NextProxyImplProvider<C>;
  static define<C>(clientImpl: NextClientImpl<C>, serverImpl: NextProxyServerImpl<C>, config?: C) {
    return new NextProxyImplProvider<C>(config as C, clientImpl, serverImpl);
  }
}
