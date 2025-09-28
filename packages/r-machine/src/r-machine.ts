import type { Config } from "./config.js";
import type { AnyLocale } from "./locale.js";
import type { AnyAtlas, AtlasNamespace, AtlasNamespaceList, RKit } from "./r.js";

export class RMachine<A extends AnyAtlas, L extends AnyLocale> {
  constructor(private config: Config<A, L>) {}

  // Can return a promise or a value
  // This is to make suspense work with react on client
  // !! Bind the function to the instance
  readonly pickR = <N extends AtlasNamespace<A>>(_locale: L, _namespace: N): A[N] | Promise<A[N]> => {
    // TODO: Implement
    void this.config;
    return undefined!;
  };

  // Can return a promise or a value
  // This is to make suspense work with react on client
  // !! Bind the function to the instance
  readonly pickRKit = <NL extends AtlasNamespaceList<A>>(
    _locale: L,
    ..._namespaces: NL
  ): RKit<A, NL> | Promise<RKit<A, NL>> => {
    // TODO: Implement
    return undefined!;
  };
}
