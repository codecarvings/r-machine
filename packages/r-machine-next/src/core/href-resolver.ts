import type { AnyPathAtlas } from "./path-atlas.js";

type HrefResolverAction = "unbound" | "bound" | "bound-explicit";
export type HrefResolver = (
  action: HrefResolverAction,
  locale: string | undefined,
  path: string,
  params?: object
) => string;
export type HrefResolverLocaleAdapter = (
  action: HrefResolverAction,
  locale: string | undefined,
  path: string
) => string;

export function createHrefResolver(_pathAtlas: AnyPathAtlas, _localeAdapter: HrefResolverLocaleAdapter): HrefResolver {
  return undefined!;
}
