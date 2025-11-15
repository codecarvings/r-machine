import type { AnyAtlas, RMachine } from "r-machine";
import { getImplFactory, type ImplFactory, type ImplProvider } from "r-machine/strategy";
import { type NextClientImpl, NextClientImplProvider, type NextClientRMachine } from "#r-machine/next/core";
import type { NextAppServerImpl } from "./next-app-server-toolset.js";

export class NextAppImplProvider<LK extends string, C> extends NextClientImplProvider<C> {
  protected constructor(
    config: C,
    clientImplFactory: ImplFactory<NextClientImpl, C>,
    protected readonly serverImplFactory: ImplFactory<NextAppServerImpl<LK>, C>
  ) {
    super(config, clientImplFactory);
  }

  protected async createServerToolset<A extends AnyAtlas>(
    rMachine: RMachine<A>,
    NextClientRMachine: NextClientRMachine
  ) {
    const impl = await this.serverImplFactory(rMachine, this.config);
    const module = await import("./next-app-server-toolset.js");
    return module.createNextAppServerToolset(rMachine, impl, NextClientRMachine);
  }

  static define<LK extends string>(
    clientImpl: ImplProvider<NextClientImpl, undefined>,
    serverImpl: ImplProvider<NextAppServerImpl<LK>, undefined>
  ): NextAppImplProvider<LK, undefined>;
  static define<LK extends string, C>(
    clientImpl: ImplProvider<NextClientImpl, C>,
    serverImpl: ImplProvider<NextAppServerImpl<LK>, C>,
    config: C
  ): NextAppImplProvider<LK, C>;
  static define<LK extends string, C>(
    clientImpl: ImplProvider<NextClientImpl, C>,
    serverImpl: ImplProvider<NextAppServerImpl<LK>, C>,
    config?: C
  ) {
    return new NextAppImplProvider<LK, C>(config as C, getImplFactory(clientImpl), getImplFactory(serverImpl));
  }
}
