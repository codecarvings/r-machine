import type { AnyAtlas, RMachine } from "r-machine";
import type { NextClientImpl, NextClientRMachine } from "#r-machine/next/core";
import { NextClientImplProvider } from "#r-machine/next/core";
import { createNextProxyPathServerToolset } from "./next-proxy-path-server-toolset.js";
import { createNextProxyServerImplPackage, type NextProxyServerImpl } from "./next-proxy-server-impl.js";

// Cannot inherit from NextProxyImplProvider due to typescript issue (Class static side incorrectly extends base class static side...)
export class NextProxyPathImplProvider<C, LK extends string> extends NextClientImplProvider<C> {
  protected constructor(
    config: C,
    clientImpl: NextClientImpl<C>,
    protected readonly serverImpl: NextProxyServerImpl<C>,
    protected readonly locateKey: LK
  ) {
    super(config, clientImpl);
  }

  protected createServerToolset<A extends AnyAtlas>(rMachine: RMachine<A>, NextClientRMachine: NextClientRMachine) {
    return createNextProxyPathServerToolset(
      rMachine,
      this.config,
      this.locateKey,
      createNextProxyServerImplPackage(this.serverImpl),
      NextClientRMachine
    );
  }

  static define<LK extends string>(
    clientImpl: NextClientImpl<undefined>,
    serverImpl: NextProxyServerImpl<undefined>,
    localeKey: LK
  ): NextProxyPathImplProvider<undefined, LK>;
  static define<C, LK extends string>(
    clientImpl: NextClientImpl<C>,
    serverImpl: NextProxyServerImpl<C>,
    localeKey: LK,
    config: C
  ): NextProxyPathImplProvider<C, LK>;
  static define<C, LK extends string>(
    clientImpl: NextClientImpl<C>,
    serverImpl: NextProxyServerImpl<C>,
    localeKey: LK,
    config?: C
  ) {
    return new NextProxyPathImplProvider<C, LK>(config as C, clientImpl, serverImpl, localeKey);
  }
}
