import type { AnyAtlas, RMachine } from "r-machine";
import { getImplFactory, type ImplFactory, type ImplProvider } from "r-machine/strategy";
import { type NextClientImpl, NextClientImplProvider, type NextClientRMachine } from "#r-machine/next/core";
import type { NextAppServerImpl } from "./next-app-server-toolset.js";

const defaultLocaleKey = "locale" as const;
export type DefaultLocaleKey = typeof defaultLocaleKey;

export class NextAppImplProvider<LK extends string, C> extends NextClientImplProvider<C> {
  protected constructor(
    config: C,
    clientImplFactory: ImplFactory<NextClientImpl, C>,
    protected readonly serverImplFactory: ImplFactory<NextAppServerImpl, C>,
    protected readonly localeKey: LK
  ) {
    super(config, clientImplFactory);
  }

  protected async createServerToolset<A extends AnyAtlas>(
    rMachine: RMachine<A>,
    NextClientRMachine: NextClientRMachine
  ) {
    const impl = await this.serverImplFactory(rMachine, this.config);
    const module = await import("./next-app-server-toolset.js");
    return module.createNextAppServerToolset(rMachine, impl, this.localeKey, NextClientRMachine);
  }

  static defaultLocaleKey = defaultLocaleKey;

  static define(
    clientImpl: ImplProvider<NextClientImpl, undefined>,
    serverImpl: ImplProvider<NextAppServerImpl, undefined>
  ): NextAppImplProvider<DefaultLocaleKey, undefined>;
  static define<LK extends string>(
    clientImpl: ImplProvider<NextClientImpl, undefined>,
    serverImpl: ImplProvider<NextAppServerImpl, undefined>,
    localeKey: LK
  ): NextAppImplProvider<LK, undefined>;
  static define<C, LK extends string>(
    clientImpl: ImplProvider<NextClientImpl, C>,
    serverImpl: ImplProvider<NextAppServerImpl, C>,
    localeKey: LK,
    config: C
  ): NextAppImplProvider<LK, C>;
  static define<C, LK extends string>(
    clientImpl: ImplProvider<NextClientImpl, C>,
    serverImpl: ImplProvider<NextAppServerImpl, C>,
    localeKey: LK = defaultLocaleKey as LK,
    config?: C
  ) {
    return new NextAppImplProvider<LK, C>(
      config as C,
      getImplFactory(clientImpl),
      getImplFactory(serverImpl),
      localeKey
    );
  }
}
