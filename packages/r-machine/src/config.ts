import { RMachineError } from "./error.js";
import type { AnyAtlas, AtlasNamespace } from "./r.js";

export interface Config<A extends AnyAtlas> {
  readonly locales: readonly string[];
  readonly fallbackLocale?: string;
  readonly rLoader: <N extends AtlasNamespace<A>>(locale: string, namespace: N) => Promise<A[N]>;
  readonly localeResolver?: (locale: string) => string;
}

export type AnyConfig = Config<any>;

export function createConfig<A extends AnyAtlas>(atlasType: A, config: Config<A>): Config<A> {
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
    locales: [...config.locales],
  };
}
