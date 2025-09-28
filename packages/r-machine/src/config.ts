import type { AnyLocale, AnyLocaleList } from "./locale.js";
import type { AnyAtlas, AtlasNamespace, AtlasNamespaceList } from "./r.js";

// Note: The generic parameter LL is required for proper type inference when calling createConfig
export interface ConfigParams<A extends AnyAtlas, LL extends AnyLocaleList> {
  readonly locales: LL;
  readonly defaultLocale: LL[number];
  readonly loader: <N extends AtlasNamespace<A>>(namespace: N, locale: LL[number]) => Promise<A[N]>;
  readonly preloadResources?: AtlasNamespaceList<A>;
}

export interface Config<A extends AnyAtlas, L extends AnyLocale> {
  readonly locales: ReadonlyArray<L>;
  readonly defaultLocale: L;
  readonly loader: <N extends AtlasNamespace<A>>(namespace: N, locale: L) => Promise<A[N]>;
  readonly preloadResources: AtlasNamespaceList<A>;
}

export function createConfig<A extends AnyAtlas, const LL extends AnyLocaleList>(
  atlasType: A,
  config: ConfigParams<A, LL>
): Config<A, LL[number]> {
  void atlasType; // Suppress unused parameter warning without prefixing with an underscore

  if (!config.locales.length) {
    throw new Error("No locales provided");
  }

  if (new Set(config.locales).size !== config.locales.length) {
    throw new Error("Duplicate locales provided");
  }

  if (!config.locales.includes(config.defaultLocale)) {
    throw new Error(`Default locale "${config.defaultLocale}" is not in the list of locales`);
  }

  return {
    ...config,
    locales: [...config.locales] as LL,
    preloadResources: config.preloadResources ?? [],
  };
}
