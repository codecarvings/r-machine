import type { AnyAtlas, RMachine } from "r-machine";
import { getImplFactory, type ImplFactory, type ImplProvider } from "r-machine/strategy";
import { type NextClientImpl, NextClientImplProvider, type NextStrategyKind } from "#r-machine/next/core";
import type { NextAppServerImpl, NextAppServerToolset } from "./next-app-server-toolset.js";

export class NextAppImplProvider<
  A extends AnyAtlas,
  SK extends NextStrategyKind,
  LK extends string,
  C,
> extends NextClientImplProvider<A, SK, C> {
  protected constructor(
    rMachine: RMachine<A>,
    kind: SK,
    config: C,
    clientImplFactory: ImplFactory<NextClientImpl, C>,
    protected readonly serverImplFactory: ImplFactory<NextAppServerImpl<LK>, C>
  ) {
    super(rMachine, kind, config, clientImplFactory);
  }

  protected serverToolsetPromise: Promise<NextAppServerToolset<SK, LK, A>> | undefined;
  createServerToolset(): Promise<NextAppServerToolset<SK, LK, A>> {
    if (this.serverToolsetPromise === undefined) {
      this.serverToolsetPromise = (async () => {
        if (this.NextClientRMachine === undefined) {
          await this.getClientToolset();
        }

        const impl = await this.serverImplFactory(this.rMachine, this.config);
        const module = await import("./next-app-server-toolset.js");
        return module.createNextAppServerToolset(this.kind, impl, this.rMachine, this.NextClientRMachine!);
      })();
    }
    return this.serverToolsetPromise;
  }

  static define<A extends AnyAtlas, SK extends NextStrategyKind, LK extends string>(
    rMachine: RMachine<A>,
    kind: SK,
    clientImpl: ImplProvider<NextClientImpl, undefined>,
    serverImpl: ImplProvider<NextAppServerImpl<LK>, undefined>
  ): NextAppImplProvider<A, SK, LK, undefined>;
  static define<A extends AnyAtlas, SK extends NextStrategyKind, LK extends string, C>(
    rMachine: RMachine<A>,
    kind: SK,
    clientImpl: ImplProvider<NextClientImpl, C>,
    serverImpl: ImplProvider<NextAppServerImpl<LK>, C>,
    config: C
  ): NextAppImplProvider<A, SK, LK, C>;
  static define<A extends AnyAtlas, SK extends NextStrategyKind, LK extends string, C>(
    rMachine: RMachine<A>,
    kind: SK,
    clientImpl: ImplProvider<NextClientImpl, C>,
    serverImpl: ImplProvider<NextAppServerImpl<LK>, C>,
    config?: C
  ) {
    return new NextAppImplProvider<A, SK, LK, C>(
      rMachine,
      kind,
      config as C,
      getImplFactory(clientImpl),
      getImplFactory(serverImpl)
    );
  }
}
