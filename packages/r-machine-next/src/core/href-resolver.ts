import { PathTranslator } from "#r-machine/next/core";
import type { AnyPathAtlas } from "./path-atlas.js";

interface ResolveHrefResult {
  readonly href: string;
  readonly dynamic: boolean;
}

export type HrefResolverFn = (locale: string, path: string, params?: object) => ResolveHrefResult;
export type HrefResolverAdapter = (locale: string, path: string) => string;

export class HrefResolver {
  constructor(
    protected readonly pathAtlas: AnyPathAtlas,
    protected readonly locales: readonly string[],
    protected readonly defaultLocale: string,
    protected readonly adapter: HrefResolverAdapter | undefined
  ) {
    this.pathTranslator = new PathTranslator(this.pathAtlas, this.locales, this.defaultLocale);
    locales.forEach((locale) => {
      this.caches[locale] = new Map<string, ResolveHrefResult>();
    });
  }

  protected readonly pathTranslator: PathTranslator;
  protected readonly caches: { [locale: string]: Map<string, ResolveHrefResult> } = {};

  readonly getResolvedHref: HrefResolverFn = (locale, path, params): ResolveHrefResult => {
    const cache = this.caches[locale];
    let result = cache.get(path);
    if (result !== undefined) {
      return result;
    }

    const translateResult = this.pathTranslator.getTranslatedPath(locale, path, params);
    let resolvedPath: string;
    if (this.adapter) {
      // Apply locale adapter
      resolvedPath = this.adapter(locale, translateResult.path);
    } else {
      resolvedPath = translateResult.path;
    }

    result = {
      href: resolvedPath,
      dynamic: translateResult.dynamic,
    };
    if (!translateResult.dynamic) {
      // Cache only static paths
      cache.set(path, result);
    }
    return result;
  };
}
