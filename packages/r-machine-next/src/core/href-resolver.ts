import type { AnyPathAtlas } from "./path-atlas.js";

export type HrefResolver = (explicit: boolean, locale: string | undefined, path: string, params?: object) => string;
export type HrefResolverLocaleAdapter = (explicit: boolean, locale: string | undefined, path: string) => string;

export function createHrefResolver(_pathAtlas: AnyPathAtlas, _localeAdapter: HrefResolverLocaleAdapter): HrefResolver {
  return undefined!;
}
