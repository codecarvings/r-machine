import type { $Locales } from "../locales.js";
import type { $Resources, NamespaceOf } from "./resource.js";

export interface PartialConfig<RS extends $Resources, LS extends $Locales> {
  readonly locales: LS;
  readonly defaultLocale: LS[number];
  readonly loader: <N extends NamespaceOf<RS>>(namespace: N, locale: LS[number]) => Promise<RS[N]>;

  readonly preloadResources?: ReadonlyArray<NamespaceOf<RS>>;
}

export interface Config<RS extends $Resources, LS extends $Locales> extends PartialConfig<RS, LS> {
  readonly preloadResources: ReadonlyArray<NamespaceOf<RS>>;
}

export function createConfig<RS extends $Resources, const LS extends $Locales>(
  resourcesType: RS,
  config: PartialConfig<RS, LS>
): Config<RS, LS> {
  void resourcesType; // Suppress unused parameter warning without prefixing with an underscore

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
    locales: [...config.locales] as LS,
    preloadResources: config.preloadResources ?? [],
  };
}

export type LocalesOf<C extends Config<any, any>> = C extends Config<infer LS, any> ? LS : never;

export type ResourcesOf<C extends Config<any, any>> = C extends Config<any, infer RS> ? RS : never;
