import type { Config } from "./config.js";
import { Engine } from "./engine.js";
import type { AnyLocale } from "./locale.js";
import type { AnyAtlas, AtlasNamespace } from "./r.js";
import type { AtlasNamespaceList, RKit } from "./r-kit.js";

// Facade for Engine
// Provides a simple API to pickR and pickRKit
// Handles the async loading of contexts internally
export class RMachine<A extends AnyAtlas, L extends AnyLocale> {
  constructor(protected config: Config<A, L>) {
    this.engine = new Engine(config);
  }

  protected engine: Engine;

  // Can return a promise or a value
  // This is to make suspense work with react on client
  // !! Bind the function to the instance
  readonly pickR = <N extends AtlasNamespace<A>>(locale: L, namespace: N): A[N] | Promise<A[N]> => {
    const ctx = this.engine.getCtx(locale);

    if (ctx instanceof Promise) {
      // Ctx is not yet ready
      return ctx.then((resolvedCtx) => resolvedCtx.pickR(namespace)) as Promise<A[N]>;
    } else {
      // Ctx is ready
      return ctx.pickR(namespace) as A[N] | Promise<A[N]>;
    }
  };

  // Can return a promise or a value
  // This is to make suspense work with react on client
  // !! Bind the function to the instance
  readonly pickRKit = <NL extends AtlasNamespaceList<A>>(
    locale: L,
    ...namespaces: NL
  ): RKit<A, NL> | Promise<RKit<A, NL>> => {
    const ctx = this.engine.getCtx(locale);

    if (ctx instanceof Promise) {
      // Ctx not yet ready
      return ctx.then((resolvedCtx) => resolvedCtx.pickRKit(...namespaces)) as Promise<RKit<A, NL>>;
    } else {
      // Ctx ready
      return ctx.pickRKit(...namespaces) as RKit<A, NL> | Promise<RKit<A, NL>>;
    }
  };
}
