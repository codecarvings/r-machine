import type { Config } from "./config.js";
import { Engine } from "./engine.js";
import type { AnyAtlas, AtlasNamespace } from "./r.js";
import type { AtlasNamespaceList, RKit } from "./r-kit.js";

// Facade for Engine
// Provides a simple API to pickR and pickRKit
// Handles the async loading of contexts internally
export class RMachine<A extends AnyAtlas> {
  constructor(protected config: Config<A>) {
    this.engine = new Engine(config);
  }

  protected engine: Engine;

  // !! Bind the function to the instance
  readonly getResolvedLocale = (locale: string): string => {
    return this.engine.getResolvedLocale(locale);
  };

  // Can return a promise or a value
  // This is to make suspense work with react on client
  // !! Bind the function to the instance
  readonly pickR = <N extends AtlasNamespace<A>>(locale: string, namespace: N): A[N] | Promise<A[N]> => {
    const resolvedLocale = this.engine.getResolvedLocale(locale);
    const ctx = this.engine.getCtx(resolvedLocale);
    return ctx.pickR(namespace) as A[N] | Promise<A[N]>;
  };

  // Can return a promise or a value
  // This is to make suspense work with react on client
  // !! Bind the function to the instance
  readonly pickRKit = <NL extends AtlasNamespaceList<A>>(
    locale: string,
    ...namespaces: NL
  ): RKit<A, NL> | Promise<RKit<A, NL>> => {
    const resolvedLocale = this.engine.getResolvedLocale(locale);
    const ctx = this.engine.getCtx(resolvedLocale);
    return ctx.pickRKit(...namespaces) as RKit<A, NL> | Promise<RKit<A, NL>>;
  };
}
