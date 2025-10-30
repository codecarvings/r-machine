import type { AnyAtlas, RMachine } from "r-machine";
import { type NextClientImpl, NextClientImplProvider, type NextClientRMachine } from "#r-machine/next/core";
import { createNextAppRouterServerImplPackage, type NextAppRouterServerImpl } from "./next-app-router-server-impl.js";
import { createNextAppRouterServerToolset } from "./next-app-router-server-toolset.js";

export class NextAppRouterImplProvider<C, LK extends string> extends NextClientImplProvider<C> {
  protected constructor(
    config: C,
    clientImpl: NextClientImpl<C>,
    protected readonly serverImpl: NextAppRouterServerImpl<C>,
    protected readonly locateKey: LK
  ) {
    super(config, clientImpl);
  }

  protected createServerToolset<A extends AnyAtlas>(rMachine: RMachine<A>, NextClientRMachine: NextClientRMachine) {
    return createNextAppRouterServerToolset(
      rMachine,
      this.config,
      this.locateKey,
      createNextAppRouterServerImplPackage(this.serverImpl),
      NextClientRMachine
    );
  }

  static define<LK extends string>(
    clientImpl: NextClientImpl<undefined>,
    serverImpl: NextAppRouterServerImpl<undefined>,
    localeKey: LK
  ): NextAppRouterImplProvider<undefined, LK>;
  static define<C, LK extends string>(
    clientImpl: NextClientImpl<C>,
    serverImpl: NextAppRouterServerImpl<C>,
    localeKey: LK,
    config: C
  ): NextAppRouterImplProvider<C, LK>;
  static define<C, LK extends string>(
    clientImpl: NextClientImpl<C>,
    serverImpl: NextAppRouterServerImpl<C>,
    localeKey: LK,
    config?: C
  ) {
    return new NextAppRouterImplProvider<C, LK>(config as C, clientImpl, serverImpl, localeKey);
  }
}
