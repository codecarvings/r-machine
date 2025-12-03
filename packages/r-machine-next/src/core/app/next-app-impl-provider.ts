import type { AnyAtlas, RMachine } from "r-machine";
import { getImplFactory, type ImplFactory, type ImplProvider } from "r-machine/strategy";
import {
  type NextClientImpl,
  NextClientImplProvider,
  type NextClientRMachine,
  type NextStrategyKind,
} from "#r-machine/next/core";
import type { NextAppServerImpl } from "./next-app-server-toolset.js";

export class NextAppImplProvider<SK extends NextStrategyKind, LK extends string, C> extends NextClientImplProvider<
  SK,
  C
> {
  protected constructor(
    kind: SK,
    config: C,
    clientImplFactory: ImplFactory<NextClientImpl, C>,
    protected readonly serverImplFactory: ImplFactory<NextAppServerImpl<LK>, C>
  ) {
    super(kind, config, clientImplFactory);
  }

  protected async createServerToolset<A extends AnyAtlas>(
    rMachine: RMachine<A>,
    NextClientRMachine: NextClientRMachine
  ) {
    const impl = await this.serverImplFactory(rMachine, this.config);
    const module = await import("./next-app-server-toolset.js");
    return module.createNextAppServerToolset(this.kind, impl, rMachine, NextClientRMachine);
  }

  static define<SK extends NextStrategyKind, LK extends string>(
    kind: SK,
    clientImpl: ImplProvider<NextClientImpl, undefined>,
    serverImpl: ImplProvider<NextAppServerImpl<LK>, undefined>
  ): NextAppImplProvider<SK, LK, undefined>;
  static define<SK extends NextStrategyKind, LK extends string, C>(
    kind: SK,
    clientImpl: ImplProvider<NextClientImpl, C>,
    serverImpl: ImplProvider<NextAppServerImpl<LK>, C>,
    config: C
  ): NextAppImplProvider<SK, LK, C>;
  static define<SK extends NextStrategyKind, LK extends string, C>(
    kind: SK,
    clientImpl: ImplProvider<NextClientImpl, C>,
    serverImpl: ImplProvider<NextAppServerImpl<LK>, C>,
    config?: C
  ) {
    return new NextAppImplProvider<SK, LK, C>(
      kind,
      config as C,
      getImplFactory(clientImpl),
      getImplFactory(serverImpl)
    );
  }
}
