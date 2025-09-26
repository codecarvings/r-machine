import type { $Resources } from "./resources.js";

export interface Config<L extends string, R extends $Resources> {
  readonly locales: ReadonlyArray<L>;
  readonly defaultLocale: L;
  readonly preloadResources: ReadonlyArray<keyof R>;
  readonly loader: <NS extends keyof R>(locale: L, namespace: NS) => Promise<R[NS]>;
}

export function createConfig<L extends string, R extends $Resources>(_resourceType: R, config: Config<L, R>) {
  if (!config.locales.length) {
    throw new Error("No locales provided");
  }

  if (!config.locales.includes(config.defaultLocale)) {
    throw new Error(`Default locale "${config.defaultLocale}" is not in the list of locales`);
  }
  return config;
}

export type LocaleOf<C extends Config<any, any>> = C extends Config<infer L, any> ? L : never;

export type ResourcesOf<C extends Config<any, any>> = C extends Config<any, infer R> ? R : never;
