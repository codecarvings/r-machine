import type { AnyAtlas, RMachine } from "r-machine";
import { getImplFactory, type ImplFactory, type ImplProvider } from "r-machine/strategy";
import { type NextClientPathImpl, NextClientPathImplProvider, type NextClientRMachine } from "#r-machine/next/core";
import type { NextAppServerPathImpl } from "./next-app-server-path-toolset.js";

export class NextAppPathImplProvider<LK extends string, C> extends NextClientPathImplProvider<C> {
  protected constructor(
    config: C,
    clientImplFactory: ImplFactory<NextClientPathImpl, C>,
    protected readonly serverImplFactory: ImplFactory<NextAppServerPathImpl<LK>, C>
  ) {
    super(config, clientImplFactory);
  }

  protected async createServerToolset<A extends AnyAtlas>(
    rMachine: RMachine<A>,
    NextClientRMachine: NextClientRMachine
  ) {
    const impl = await this.serverImplFactory(rMachine, this.config);
    const module = await import("./next-app-server-path-toolset.js");
    return module.createNextAppServerPathToolset(rMachine, impl, NextClientRMachine);
  }

  static define<LK extends string>(
    clientImpl: ImplProvider<NextClientPathImpl, undefined>,
    serverImpl: ImplProvider<NextAppServerPathImpl<LK>, undefined>
  ): NextAppPathImplProvider<LK, undefined>;
  static define<LK extends string, C>(
    clientImpl: ImplProvider<NextClientPathImpl, C>,
    serverImpl: ImplProvider<NextAppServerPathImpl<LK>, C>,
    config: C
  ): NextAppPathImplProvider<LK, C>;
  static define<LK extends string, C>(
    clientImpl: ImplProvider<NextClientPathImpl, C>,
    serverImpl: ImplProvider<NextAppServerPathImpl<LK>, C>,
    config?: C
  ) {
    return new NextAppPathImplProvider<LK, C>(config as C, getImplFactory(clientImpl), getImplFactory(serverImpl));
  }
}
