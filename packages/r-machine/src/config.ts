import { RMachineError } from "./error.js";
import type { AnyLocale, AnyLocaleList, LocaleList } from "./locale.js";
import type { AnyAtlas, AtlasNamespace } from "./r.js";

// Note: The generic parameter LL is required for proper type inference when calling createConfig
export interface ConfigParams<A extends AnyAtlas, LL extends AnyLocaleList> {
  readonly locales: LL;
  readonly fallbackLocale?: LL[number];
  readonly rLoader: <N extends AtlasNamespace<A>>(locale: LL[number], namespace: N) => Promise<A[N]>;
  readonly localeResolver?: (locale: AnyLocale) => LL[number];
}

export interface Config<A extends AnyAtlas, L extends AnyLocale> {
  readonly locales: LocaleList<L>;
  readonly fallbackLocale?: L;
  readonly rLoader: <N extends AtlasNamespace<A>>(locale: L, namespace: N) => Promise<A[N]>;
  readonly localeResolver?: (locale: AnyLocale) => L;
}

export type AnyConfig = Config<any, any>;

export function createConfig<A extends AnyAtlas, const LL extends AnyLocaleList>(
  atlasType: A,
  config: ConfigParams<A, LL>
): Config<A, LL[number]> {
  void atlasType; // Suppress unused parameter warning without prefixing with an underscore

  if (!config.locales.length) {
    throw new RMachineError("No locales provided");
  }

  if (new Set(config.locales).size !== config.locales.length) {
    throw new RMachineError("Duplicate locales provided");
  }

  if (config.fallbackLocale !== undefined && !config.locales.includes(config.fallbackLocale)) {
    throw new RMachineError(`Fallback locale "${config.fallbackLocale}" is not in the list of locales`);
  }

  return {
    ...config,
    locales: [...config.locales] as LL,
  };
}
