import type { AnyAtlas, RMachine } from "r-machine";
import { getImplFactory, type ImplFactory, type ImplProvider } from "r-machine/strategy";
import { type NextClientImpl, NextClientImplProvider, type NextClientRMachine } from "#r-machine/next/core";
import { createNextAppRouterServerToolset, type NextAppRouterServerImpl } from "./next-app-router-server-toolset.js";

export class NextAppRouterImplProvider<LK extends string, C> extends NextClientImplProvider<C> {
  protected constructor(
    config: C,
    clientImplFactory: ImplFactory<NextClientImpl, C>,
    protected readonly serverImplFactory: ImplFactory<NextAppRouterServerImpl, C>,
    protected readonly localeKey: LK
  ) {
    super(config, clientImplFactory);
  }

  protected createServerToolset<A extends AnyAtlas>(rMachine: RMachine<A>, NextClientRMachine: NextClientRMachine) {
    return createNextAppRouterServerToolset(
      rMachine,
      this.serverImplFactory(rMachine, this.config),
      this.localeKey,
      NextClientRMachine
    );
  }

  static define<LK extends string>(
    clientImpl: ImplProvider<NextClientImpl, undefined>,
    serverImpl: ImplProvider<NextAppRouterServerImpl, undefined>,
    localeKey: LK
  ): NextAppRouterImplProvider<LK, undefined>;
  static define<C, LK extends string>(
    clientImpl: ImplProvider<NextClientImpl, C>,
    serverImpl: ImplProvider<NextAppRouterServerImpl, C>,
    localeKey: LK,
    config: C
  ): NextAppRouterImplProvider<LK, C>;
  static define<C, LK extends string>(
    clientImpl: ImplProvider<NextClientImpl, C>,
    serverImpl: ImplProvider<NextAppRouterServerImpl, C>,
    localeKey: LK,
    config?: C
  ) {
    return new NextAppRouterImplProvider<LK, C>(
      config as C,
      getImplFactory(clientImpl),
      getImplFactory(serverImpl),
      localeKey
    );
  }
}
